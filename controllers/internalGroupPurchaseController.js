const { GroupPurchaseOrder } = require('../models/Index');

// Called by tree-shops after a group purchase deal is confirmed and all holds captured.
// Creates one GroupPurchaseOrder record per participant for traceability.
// Body: { dealId, shopId, productId, specialPrice, participants: [{ userId, quantity }] }
const createGroupPurchaseOrders = async (req, res) => {
  try {
    const { dealId, shopId, productId, specialPrice, participants } = req.body;

    if (!dealId || !shopId || !productId || !specialPrice || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ error: 'INVALID_REQUEST', message: 'dealId, shopId, productId, specialPrice, and a non-empty participants array are required' });
    }

    const unitPrice = parseFloat(specialPrice);

    const records = await GroupPurchaseOrder.bulkCreate(
      participants.map(({ userId, quantity }) => ({
        dealId,
        userId,
        shopId,
        productId,
        quantity,
        unitPrice,
        totalAmount: parseFloat((unitPrice * quantity).toFixed(4)),
        status: 'confirmed'
      }))
    );

    return res.status(201).json({
      success: true,
      created: records.length,
      dealId
    });
  } catch (err) {
    console.error('[createGroupPurchaseOrders] error:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

module.exports = { createGroupPurchaseOrders };
