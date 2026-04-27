const { Order, SubOrder } = require('../models/Index');

async function recalculateOrderStatus(orderId, transaction) {
  const subOrders = await SubOrder.findAll({ where: { orderId }, transaction });
  const statuses = subOrders.map(s => s.status);

  let newStatus;

  if (statuses.every(s => s === 'cancelled')) {
    newStatus = 'cancelled';
  } else if (statuses.every(s => s === 'delivered' || s === 'cancelled')) {
    newStatus = 'delivered';
  } else if (statuses.some(s => ['in_transit', 'at_dest_hub'].includes(s))) {
    newStatus = 'in_transit';
  } else if (statuses.some(s => ['picked_up', 'at_origin_hub', 'out_for_delivery'].includes(s))) {
    newStatus = 'processing';
  } else {
    newStatus = 'pending';
  }

  await Order.update({ status: newStatus }, { where: { id: orderId }, transaction });
  return newStatus;
}

module.exports = { recalculateOrderStatus };
