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
    // STEP 2 — load & validate subcart(s)
    let subCarts = [];
    let resolvedCartId;

    if (shopId) {
      const { ok, status, body } = await shopsClient.getOpenSubCartByShop(customerId, shopId);
      if (status === 404) return res.status(404).json({ error: 'SUBCART_NOT_FOUND', message: 'No open subcart found for this shop' });
      if (!ok) return res.status(502).json({ error: 'SHOPS_SERVICE_ERROR' });
      if (body.customerId !== customerId) return res.status(403).json({ error: 'FORBIDDEN' });
      subCarts = [body];
      resolvedCartId = body.cartId;
    } else {
      const { ok, status, body } = await shopsClient.getCart(cartId);
      if (status === 404) return res.status(404).json({ error: 'CART_NOT_FOUND' });
      if (!ok) return res.status(502).json({ error: 'SHOPS_SERVICE_ERROR' });
      if (body.customerId !== customerId) return res.status(403).json({ error: 'FORBIDDEN' });
      if (body.status !== 'open') return res.status(409).json({ error: 'CART_NOT_OPEN', message: 'Cart is already checked out' });
      subCarts = (body.subCarts || []).filter(sc => sc.status === 'open');
      if (subCarts.length === 0) return res.status(400).json({ error: 'CART_EMPTY', message: 'No items to check out' });
      resolvedCartId = cartId;
    }

    // STEP 3 — fetch live prices & validate stock
    const productCache = new Map();
    for (const sc of subCarts) {
      for (const item of sc.items) {
        if (productCache.has(item.productId)) continue;
        const { ok, status, body } = await shopsClient.getProduct(item.productId);
        if (status === 404 || !body.isActive) return res.status(422).json({ error: 'PRODUCT_OUT_OF_STOCK', message: `Product ${item.productId} is unavailable`, productId: item.productId });
        if (!ok) return res.status(502).json({ error: 'SHOPS_SERVICE_ERROR' });
        if (body.stock < item.quantity) return res.status(422).json({ error: 'PRODUCT_OUT_OF_STOCK', message: `Insufficient stock for product ${item.productId}`, productId: item.productId });
        productCache.set(item.productId, body);
      }
    }

    // STEP 4 — resolve delivery address & destination hub
    const address = await DeliveryAddress.findOne({ where: { id: addressId, customerId } });
    if (!address) return res.status(404).json({ error: 'ADDRESS_NOT_FOUND' });

    const destinationCityId = address.cityId;
    const destHub = await Center.findOne({ where: { cityId: destinationCityId, type: 'main' } });
    if (!destHub) return res.status(422).json({ error: 'NO_DELIVERY_COVERAGE', message: 'No main center for destination city' });

    // STEP 5 — resolve origin hubs & calculate totals
    const subCartData = [];
    let totalAmount = 0;

    for (const sc of subCarts) {
      const originHub = await Center.findOne({ where: { cityId: sc.shopCityId, type: 'main' } });
      if (!originHub) return res.status(422).json({ error: 'NO_HUB_FOR_SHOP_CITY', message: `Shop city ${sc.shopCityId} has no main center` });

      let subtotal = 0;
      const itemsWithPrice = sc.items.map(item => {
        const product = productCache.get(item.productId);
        const lineTotal = parseFloat(product.currentPrice) * item.quantity;
        subtotal += lineTotal;
        return { ...item, unitPrice: parseFloat(product.currentPrice) };
      });

      subtotal = parseFloat(subtotal.toFixed(4));
      totalAmount += subtotal;
      subCartData.push({ subCart: sc, originHubId: originHub.id, subtotal, itemsWithPrice });
    }

    totalAmount = parseFloat(totalAmount.toFixed(4));

    // STEP 6 — get customer wallet
    const accountRes = await financialClient.getAccountByUser(customerId, 'SYP');
    if (accountRes.status === 404) return res.status(400).json({ error: 'INSUFFICIENT_BALANCE', message: 'No SYP wallet found' });
    if (!accountRes.ok) return res.status(502).json({ error: 'FINANCIAL_SERVICE_ERROR' });
    const customerAccountSN = accountRes.body.accountSN;

    // STEP 7 — check available balance
    const balanceRes = await financialClient.getAvailableBalance(customerAccountSN);
    if (!balanceRes.ok) return res.status(502).json({ error: 'FINANCIAL_SERVICE_ERROR' });
    if (parseFloat(balanceRes.body.availableBalance) < totalAmount) {
      return res.status(400).json({ error: 'INSUFFICIENT_BALANCE', message: 'Available balance is less than order total' });
    }

    // STEP 8 — create holds (before any DB writes to tree-orders)
    const createdHolds = [];
    for (const { subCart, subtotal } of subCartData) {
      const holdRes = await financialClient.createHold(customerAccountSN, subtotal, 'pending-checkout');
      if (!holdRes.ok) {
        // release all holds created so far in reverse
        for (const h of createdHolds.reverse()) {
          await financialClient.releaseHold(h.holdId).catch(() => {});
        }
        return res.status(500).json({ error: 'CHECKOUT_HOLD_FAILED', message: 'Payment reservation failed; no charge made' });
      }
      createdHolds.push({ subCartId: subCart.id, holdId: holdRes.body.holdId });
    }

    // STEP 9 — create order
    const order = await Order.create({
      customerId,
      cartId: resolvedCartId,
      deliveryAddressId: address.id,
      destinationCityId,
      destHubId: destHub.id,
      status: 'pending',
      totalAmount
    });

    // STEP 10 — create suborders + items + logs + update hold references
    const createdSubOrders = [];
    for (let i = 0; i < subCartData.length; i++) {
      const { subCart, originHubId, subtotal, itemsWithPrice } = subCartData[i];
      const { holdId } = createdHolds[i];

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
        itemsWithPrice.map(item => ({
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

      // update hold reference to tie it to this suborder
      await financialClient.updateHoldReference(holdId, `suborder-${subOrder.id}`).catch(() => {});

      const items = await SubOrderItem.findAll({ where: { subOrderId: subOrder.id } });
      createdSubOrders.push({ ...subOrder.toJSON(), items: items.map(i => i.toJSON()) });
    }

    // STEP 11 — mark subcarts as checked out in tree-shops
    for (const { subCart } of subCartData) {
      const checkoutRes = await shopsClient.checkoutSubCart(subCart.id).catch(() => null);
      // partial checkout: subcart was moved to a new isolated cart — update order reference
      if (checkoutRes?.ok && checkoutRes.body?.cartId && checkoutRes.body.cartId !== resolvedCartId) {
        await order.update({ cartId: checkoutRes.body.cartId }).catch(() => {});
      }
    }

    // STEP 12 — respond
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
