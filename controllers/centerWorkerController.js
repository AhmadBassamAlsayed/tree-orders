const { sequelize } = require('../config/database');
const { SubOrder, SubOrderStatusLog } = require('../models/Index');
const { recalculateOrderStatus } = require('../utils/orderStatus.utils');

const listAssignedSubOrders = async (req, res) => {
  try {
    const { status = 'assigned' } = req.query;
    const subOrders = await SubOrder.findAll({
      where: { smallCenterId: req.center.id, status }
    });
    return res.status(200).json(subOrders);
  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

const pickupSubOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const subOrder = await SubOrder.findByPk(req.params.id, { transaction: t });
    if (!subOrder) { await t.rollback(); return res.status(404).json({ error: 'SUBORDER_NOT_FOUND' }); }
    if (subOrder.smallCenterId !== req.center.id) {
      await t.rollback();
      return res.status(403).json({ error: 'UNAUTHORIZED_CENTER', message: 'SubOrder not assigned to your center' });
    }
    if (subOrder.status !== 'assigned') {
      await t.rollback();
      return res.status(400).json({ error: 'INVALID_STATUS_TRANSITION' });
    }

    await subOrder.update({ status: 'picked_up' }, { transaction: t });
    await SubOrderStatusLog.create({
      subOrderId: subOrder.id, fromStatus: 'assigned', toStatus: 'picked_up',
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

const handoffSubOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const subOrder = await SubOrder.findByPk(req.params.id, { transaction: t });
    if (!subOrder) { await t.rollback(); return res.status(404).json({ error: 'SUBORDER_NOT_FOUND' }); }
    if (subOrder.smallCenterId !== req.center.id) {
      await t.rollback();
      return res.status(403).json({ error: 'UNAUTHORIZED_CENTER', message: 'SubOrder not assigned to your center' });
    }
    if (subOrder.status !== 'picked_up') {
      await t.rollback();
      return res.status(400).json({ error: 'INVALID_STATUS_TRANSITION' });
    }

    await subOrder.update({ status: 'at_origin_hub' }, { transaction: t });
    await SubOrderStatusLog.create({
      subOrderId: subOrder.id, fromStatus: 'picked_up', toStatus: 'at_origin_hub',
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

module.exports = { listAssignedSubOrders, pickupSubOrder, handoffSubOrder };
