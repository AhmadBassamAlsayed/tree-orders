const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { Order, SubOrder, SubOrderItem, SubOrderStatusLog } = require('../models/Index');
const { recalculateOrderStatus } = require('../utils/orderStatus.utils');
const financialClient = require('../utils/financialClient');
const shopsClient = require('../utils/shopsClient');

const getIncomingSubOrders = async (req, res) => {
  try {
    const subOrders = await SubOrder.findAll({
      where: { originHubId: req.center.id, status: 'at_origin_hub' }
    });
    return res.status(200).json(subOrders);
  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

const shipSubOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const subOrder = await SubOrder.findByPk(req.params.id, { transaction: t });
    if (!subOrder) { await t.rollback(); return res.status(404).json({ error: 'SUBORDER_NOT_FOUND' }); }
    if (subOrder.originHubId !== req.center.id) {
      await t.rollback();
      return res.status(403).json({ error: 'UNAUTHORIZED_CENTER' });
    }
    if (subOrder.status !== 'at_origin_hub') {
      await t.rollback();
      return res.status(400).json({ error: 'INVALID_STATUS_TRANSITION' });
    }

    // Local order shortcut: same origin and dest hub → skip in_transit
    const newStatus = subOrder.originHubId === subOrder.destHubId ? 'out_for_delivery' : 'in_transit';

    await subOrder.update({ status: newStatus }, { transaction: t });
    await SubOrderStatusLog.create({
      subOrderId: subOrder.id, fromStatus: 'at_origin_hub', toStatus: newStatus,
      changedBy: req.userId, changedByRole: req.centerRole
    }, { transaction: t });

    await recalculateOrderStatus(subOrder.orderId, t);
    await t.commit();
    return res.status(200).json(subOrder);
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

const getArrivedSubOrders = async (req, res) => {
  try {
    const subOrders = await SubOrder.findAll({
      where: { destHubId: req.center.id, status: 'at_dest_hub' }
    });
    return res.status(200).json(subOrders);
  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

const receiveSubOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const subOrder = await SubOrder.findByPk(req.params.id, { transaction: t });
    if (!subOrder) { await t.rollback(); return res.status(404).json({ error: 'SUBORDER_NOT_FOUND' }); }
    if (subOrder.destHubId !== req.center.id) {
      await t.rollback();
      return res.status(403).json({ error: 'UNAUTHORIZED_CENTER' });
    }
    if (subOrder.status !== 'in_transit') {
      await t.rollback();
      return res.status(400).json({ error: 'INVALID_STATUS_TRANSITION' });
    }

    await subOrder.update({ status: 'at_dest_hub' }, { transaction: t });
    await SubOrderStatusLog.create({
      subOrderId: subOrder.id, fromStatus: 'in_transit', toStatus: 'at_dest_hub',
      changedBy: req.userId, changedByRole: req.centerRole
    }, { transaction: t });

    await recalculateOrderStatus(subOrder.orderId, t);
    await t.commit();
    return res.status(200).json(subOrder);
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

const getReadyOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { destHubId: req.center.id, status: { [Op.not]: ['delivered', 'cancelled'] } },
      include: [{ model: SubOrder, as: 'subOrders', attributes: ['id', 'shopId', 'status'] }]
    });

    const ready = orders.filter(order => {
      const active = order.subOrders.filter(s => s.status !== 'cancelled');
      return active.length > 0 && active.every(s => ['at_dest_hub', 'delivered'].includes(s.status));
    });

    return res.status(200).json(ready.map(o => ({
      orderId: o.id,
      customerId: o.customerId,
      subOrders: o.subOrders
    })));
  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

const dispatchOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { orderId } = req.params;
    const order = await Order.findByPk(orderId, {
      include: [{ model: SubOrder, as: 'subOrders' }],
      transaction: t
    });

    if (!order) { await t.rollback(); return res.status(404).json({ error: 'ORDER_NOT_FOUND' }); }
    if (order.destHubId !== req.center.id) {
      await t.rollback();
      return res.status(403).json({ error: 'UNAUTHORIZED_CENTER' });
    }

    const active = order.subOrders.filter(s => s.status !== 'cancelled');
    const notReady = active.filter(s => s.status !== 'at_dest_hub');
    if (notReady.length > 0) {
      await t.rollback();
      return res.status(409).json({ error: 'ORDER_NOT_READY_TO_DISPATCH', message: 'Some SubOrders have not arrived yet' });
    }

    for (const so of active) {
      await so.update({ status: 'out_for_delivery' }, { transaction: t });
      await SubOrderStatusLog.create({
        subOrderId: so.id, fromStatus: 'at_dest_hub', toStatus: 'out_for_delivery',
        changedBy: req.userId, changedByRole: req.centerRole
      }, { transaction: t });
    }

    const newOrderStatus = await recalculateOrderStatus(orderId, t);
    await t.commit();

    return res.status(200).json({ ...order.toJSON(), status: newOrderStatus });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

const deliverSubOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const subOrder = await SubOrder.findByPk(req.params.id, { transaction: t });
    if (!subOrder) { await t.rollback(); return res.status(404).json({ error: 'SUBORDER_NOT_FOUND' }); }
    if (subOrder.destHubId !== req.center.id) {
      await t.rollback();
      return res.status(403).json({ error: 'UNAUTHORIZED_CENTER' });
    }
    if (subOrder.status !== 'out_for_delivery') {
      await t.rollback();
      return res.status(400).json({ error: 'SUBORDER_NOT_OUT_FOR_DELIVERY' });
    }

    // Get shop account SN from tree-shops
    const shopRes = await shopsClient.getShop(subOrder.shopId);
    if (!shopRes.ok) {
      await t.rollback();
      return res.status(500).json({ error: 'CAPTURE_FAILED', message: 'Could not fetch shop account' });
    }

    // Capture hold in tree-financial BEFORE marking delivered
    const captureRes = await financialClient.captureHold(subOrder.holdId, shopRes.body.accountSN);
    if (!captureRes.ok) {
      await t.rollback();
      return res.status(500).json({ error: 'CAPTURE_FAILED', message: 'Hold capture failed; SubOrder not marked delivered' });
    }

    await subOrder.update({ status: 'delivered' }, { transaction: t });
    await SubOrderStatusLog.create({
      subOrderId: subOrder.id, fromStatus: 'out_for_delivery', toStatus: 'delivered',
      changedBy: req.userId, changedByRole: req.centerRole
    }, { transaction: t });

    const newOrderStatus = await recalculateOrderStatus(subOrder.orderId, t);
    await t.commit();

    return res.status(200).json({
      subOrder: { id: subOrder.id, status: 'delivered' },
      order: { id: subOrder.orderId, status: newOrderStatus }
    });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

module.exports = { getIncomingSubOrders, shipSubOrder, getArrivedSubOrders, receiveSubOrder, getReadyOrders, dispatchOrder, deliverSubOrder };
