const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { Order, SubOrder, SubOrderItem, SubOrderStatusLog, DeliveryAddress } = require('../models/Index');
const { recalculateOrderStatus } = require('../utils/orderStatus.utils');
const financialClient = require('../utils/financialClient');

const listOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { customerId: req.userId };
    if (status) where.status = status;

    const { count, rows } = await Order.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [{ model: SubOrder, as: 'subOrders', attributes: ['id'] }]
    });

    return res.status(200).json({
      data: rows.map(o => ({
        id: o.id,
        status: o.status,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt,
        subOrderCount: o.subOrders.length
      })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count }
    });
  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

const getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id },
      include: [
        { model: DeliveryAddress, as: 'deliveryAddress', attributes: ['street', 'cityId'] },
        {
          model: SubOrder,
          as: 'subOrders',
          include: [{ model: SubOrderItem, as: 'items' }]
        }
      ]
    });

    if (!order) return res.status(404).json({ error: 'ORDER_NOT_FOUND' });
    if (order.customerId !== req.userId) return res.status(403).json({ error: 'FORBIDDEN' });

    return res.status(200).json({
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      deliveryAddress: order.deliveryAddress,
      subOrders: order.subOrders
    });
  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

const cancelSubOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { orderId, subOrderId } = req.params;

    const order = await Order.findByPk(orderId, { transaction: t });
    if (!order) { await t.rollback(); return res.status(404).json({ error: 'ORDER_NOT_FOUND' }); }
    if (order.customerId !== req.userId) { await t.rollback(); return res.status(403).json({ error: 'FORBIDDEN' }); }

    const subOrder = await SubOrder.findOne({ where: { id: subOrderId, orderId }, transaction: t });
    if (!subOrder) { await t.rollback(); return res.status(404).json({ error: 'SUBORDER_NOT_FOUND' }); }

    if (!['pending', 'assigned'].includes(subOrder.status)) {
      await t.rollback();
      return res.status(400).json({ error: 'SUBORDER_ALREADY_PICKED_UP', message: 'Cannot cancel after pickup' });
    }

    // Release hold BEFORE updating status
    const releaseRes = await financialClient.releaseHold(subOrder.holdId);
    if (!releaseRes.ok) {
      await t.rollback();
      return res.status(500).json({ error: 'RELEASE_FAILED', message: 'Hold release failed; SubOrder not cancelled' });
    }

    const oldStatus = subOrder.status;
    await subOrder.update({ status: 'cancelled' }, { transaction: t });

    await SubOrderStatusLog.create({
      subOrderId: subOrder.id,
      fromStatus: oldStatus,
      toStatus: 'cancelled',
      changedBy: req.userId,
      changedByRole: 'customer'
    }, { transaction: t });

    const newOrderStatus = await recalculateOrderStatus(orderId, t);

    await t.commit();

    return res.status(200).json({
      subOrder: { id: subOrder.id, status: 'cancelled' },
      order: { id: order.id, status: newOrderStatus }
    });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

module.exports = { listOrders, getOrder, cancelSubOrder };
