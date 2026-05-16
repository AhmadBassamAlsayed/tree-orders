const BASE = () => process.env.SHOPS_BASE_URL;
const SECRET = () => process.env.INTERNAL_API_SECRET;

const internalFetch = async (path, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${BASE()}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': SECRET(),
        ...(options.headers || {})
      },
      signal: controller.signal
    });
    clearTimeout(timeout);
    const body = await res.json();
    return { status: res.status, ok: res.ok, body };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw Object.assign(new Error('Shops service timed out'), { status: 503 });
    throw err;
  }
};

const getCart = (cartId) =>
  internalFetch(`/api/internal/carts/${cartId}`);

const getSubCart = (subCartId) =>
  internalFetch(`/api/internal/sub-carts/${subCartId}`);

const getProduct = (productId) =>
  internalFetch(`/api/internal/products/${productId}`);

const getShop = (shopId) =>
  internalFetch(`/api/internal/shops/${shopId}`);

const getOpenSubCartByShop = (userId, shopId) =>
  internalFetch(`/api/internal/sub-carts/by-shop?userId=${userId}&shopId=${shopId}`);

const checkoutSubCart = (subCartId) =>
  internalFetch(`/api/internal/sub-carts/${subCartId}/checkout`, { method: 'PATCH' });

const getComboOffer = (comboOfferId) =>
  internalFetch(`/api/internal/combo-offers/${comboOfferId}`);

const purchaseCombo = (comboOfferId, quantity) =>
  internalFetch(`/api/internal/combo-offers/${comboOfferId}/purchase`, {
    method: 'POST',
    body: JSON.stringify({ quantity })
  });

const refundCombo = (comboOfferId, quantity) =>
  internalFetch(`/api/internal/combo-offers/${comboOfferId}/refund`, {
    method: 'POST',
    body: JSON.stringify({ quantity })
  });

module.exports = { getCart, getSubCart, getOpenSubCartByShop, getProduct, getShop, checkoutSubCart, getComboOffer, purchaseCombo, refundCombo };
