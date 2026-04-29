const BASE = () => process.env.FINANCIAL_BASE_URL;
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
    if (err.name === 'AbortError') throw Object.assign(new Error('Financial service timed out'), { status: 503 });
    throw err;
  }
};

const getAccountByUser = (userId, currency) =>
  internalFetch(`/api/internal/accounts?userId=${userId}&currency=${encodeURIComponent(currency)}`);

const getAvailableBalance = (accountSN) =>
  internalFetch(`/api/internal/accounts/${encodeURIComponent(accountSN)}/available-balance`);

const createHoldsBatch = (userId, currency, holds) =>
  internalFetch('/api/internal/holds/batch', {
    method: 'POST',
    body: JSON.stringify({ userId, currency, holds })
  });

const createHold = (accountSN, amount, reference) =>
  internalFetch('/api/internal/holds', {
    method: 'POST',
    body: JSON.stringify({ accountSN, amount: amount.toFixed(4), reference })
  });

const updateHoldReference = (holdId, reference) =>
  internalFetch(`/api/internal/holds/${holdId}/reference`, {
    method: 'PATCH',
    body: JSON.stringify({ reference })
  });

const releaseHold = (holdId) =>
  internalFetch(`/api/internal/holds/${holdId}/release`, { method: 'POST' });

const captureHold = (holdId, shopAccountSN) =>
  internalFetch(`/api/internal/holds/${holdId}/capture`, {
    method: 'POST',
    body: JSON.stringify({ shopAccountSN })
  });

module.exports = { getAccountByUser, getAvailableBalance, createHoldsBatch, createHold, updateHoldReference, releaseHold, captureHold };
