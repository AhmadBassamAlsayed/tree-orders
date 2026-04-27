const { Order, SubOrder } = require('../models/Index');

const getOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'ORDER_NOT_FOUND' });
    return res.status(200).json({
      id: order.id,
      customerId: order.customerId,
      cartId: order.cartId,
      destinationCityId: order.destinationCityId,
      destHubId: order.destHubId,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt
    });
  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

const getSubOrder = async (req, res) => {
  try {
    const subOrder = await SubOrder.findByPk(req.params.id);
    if (!subOrder) return res.status(404).json({ error: 'SUBORDER_NOT_FOUND' });
    return res.status(200).json({
      id: subOrder.id,
      orderId: subOrder.orderId,
      shopId: subOrder.shopId,
      shopCityId: subOrder.shopCityId,
      holdId: subOrder.holdId,
      smallCenterId: subOrder.smallCenterId,
      originHubId: subOrder.originHubId,
      destHubId: subOrder.destHubId,
      status: subOrder.status,
      totalAmount: subOrder.totalAmount
    });
  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

module.exports = { getOrder, getSubOrder };
