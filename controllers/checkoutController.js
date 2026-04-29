const { sequelize } = require('../config/database');
const { Order, SubOrder, SubOrderItem, SubOrderStatusLog, DeliveryAddress, Center } = require('../models/Index');
const shopsClient = require('../utils/shopsClient');
const financialClient = require('../utils/financialClient');

const checkout = async (req, res) => {
  const { cartId, shopId, addressId } = req.body;
  const customerId = req.userId;

  // STEP 1 — validate input
  if ((!cartId && !shopId) || (cartId && shopId)) {
    return res.status(400).json({ error: 'MISSING_CHECKOUT_TARGET', message: 'Provide either cartId or shopId, not both' });
  }

  try {
    // STEP 2 — load subcart(s); internal endpoint validates products/categories/shops in 3 queries
    let subCarts = [];
    let resolvedCartId;

    if (shopId) {
      const { ok, status, body } = await shopsClient.getOpenSubCartByShop(customerId, shopId);
      if (status === 404) return res.status(404).json({ error: 'SUBCART_NOT_FOUND', message: 'No open subcart found for this shop' });
      if (status === 422) return res.status(422).json(body);
      if (!ok) return res.status(502).json({ error: 'SHOPS_SERVICE_ERROR' });
      if (body.customerId !== customerId) return res.status(403).json({ error: 'FORBIDDEN' });
      subCarts = [body];
      resolvedCartId = body.cartId;
    } else {
      const { ok, status, body } = await shopsClient.getCart(cartId);
      if (status === 404) return res.status(404).json({ error: 'CART_NOT_FOUND' });
      if (status === 422) return res.status(422).json(body);
      if (!ok) return res.status(502).json({ error: 'SHOPS_SERVICE_ERROR' });
      if (body.customerId !== customerId) return res.status(403).json({ error: 'FORBIDDEN' });
      if (body.status !== 'open') return res.status(409).json({ error: 'CART_NOT_OPEN', message: 'Cart is already checked out' });
      subCarts = (body.subCarts || []).filter(sc => sc.status === 'open');
      if (subCarts.length === 0) return res.status(400).json({ error: 'CART_EMPTY', message: 'No items to check out' });
      resolvedCartId = cartId;
    }

    // STEP 3 — resolve delivery address & destination hub
    const address = await DeliveryAddress.findOne({ where: { id: addressId, customerId } });
    if (!address) return res.status(404).json({ error: 'ADDRESS_NOT_FOUND' });

    const destinationCityId = address.cityId;
    const destHub = await Center.findOne({ where: { cityId: destinationCityId, type: 'main' } });
    if (!destHub) return res.status(422).json({ error: 'NO_DELIVERY_COVERAGE', message: 'No main center for destination city' });

    // STEP 4 — resolve origin hubs & calculate totals using prices returned by step 2
    const subCartData = [];
    let totalAmount = 0;

    for (const sc of subCarts) {
      const originHub = await Center.findOne({ where: { cityId: sc.shopCityId, type: 'main' } });
      if (!originHub) return res.status(422).json({ error: 'NO_HUB_FOR_SHOP_CITY', message: `Shop city ${sc.shopCityId} has no main center` });

      let subtotal = 0;
      for (const item of sc.items) {
        subtotal += parseFloat(item.unitPrice) * item.quantity;
      }
      subtotal = parseFloat(subtotal.toFixed(4));
      totalAmount += subtotal;
      subCartData.push({ subCart: sc, originHubId: originHub.id, subtotal });
    }

    totalAmount = parseFloat(totalAmount.toFixed(4));

    // STEP 5 — check balance and create all holds atomically in one financial call
    const holdsPayload = subCartData.map(({ subtotal }) => ({
      amount: subtotal.toFixed(4),
      reference: 'pending-checkout'
    }));

    const holdsRes = await financialClient.createHoldsBatch(customerId, 'SYP', holdsPayload);
    if (holdsRes.status === 404) return res.status(400).json({ error: 'INSUFFICIENT_BALANCE', message: 'No SYP wallet found' });
    if (holdsRes.status === 400) return res.status(400).json({ error: 'INSUFFICIENT_BALANCE', message: holdsRes.body.message || 'Available balance is less than order total' });
    if (!holdsRes.ok) return res.status(502).json({ error: 'FINANCIAL_SERVICE_ERROR' });

    const holdIds = holdsRes.body.holdIds;

    // STEP 6 — create order
    const order = await Order.create({
      customerId,
      cartId: resolvedCartId,
      deliveryAddressId: address.id,
      destinationCityId,
      destHubId: destHub.id,
      status: 'pending',
      totalAmount
    });

    // STEP 7 — create suborders + items + logs + update hold references
    const createdSubOrders = [];
    for (let i = 0; i < subCartData.length; i++) {
      const { subCart, originHubId, subtotal } = subCartData[i];
      const holdId = holdIds[i];

      const subOrder = await SubOrder.create({
        orderId: order.id,
        shopId: subCart.shopId,
        shopCityId: subCart.shopCityId,
        holdId,
        originHubId,
        destHubId: destHub.id,
        status: 'pending',
        totalAmount: subtotal
      });

      await SubOrderItem.bulkCreate(
        subCart.items.map(item => ({
          subOrderId: subOrder.id,
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
      );

      await SubOrderStatusLog.create({
        subOrderId: subOrder.id,
        fromStatus: null,
        toStatus: 'pending',
        changedBy: customerId,
        changedByRole: 'system'
      });

      await financialClient.updateHoldReference(holdId, `suborder-${subOrder.id}`).catch(() => {});

      const items = await SubOrderItem.findAll({ where: { subOrderId: subOrder.id } });
      createdSubOrders.push({ ...subOrder.toJSON(), items: items.map(i => i.toJSON()) });
    }

    // STEP 8 — mark subcarts as checked out in tree-shops
    for (const { subCart } of subCartData) {
      const checkoutRes = await shopsClient.checkoutSubCart(subCart.id).catch(() => null);
      if (checkoutRes?.ok && checkoutRes.body?.cartId && checkoutRes.body.cartId !== resolvedCartId) {
        await order.update({ cartId: checkoutRes.body.cartId }).catch(() => {});
      }
    }

    // STEP 9 — respond
    return res.status(201).json({
      order: {
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        deliveryAddress: { street: address.street, cityId: address.cityId },
        subOrders: createdSubOrders.map(so => ({
          id: so.id,
          shopId: so.shopId,
          status: so.status,
          totalAmount: so.totalAmount,
          items: so.items.map(i => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            unitPrice: i.unitPrice
          }))
        }))
      }
    });
  } catch (err) {
    console.error('checkout error:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

module.exports = { checkout };
