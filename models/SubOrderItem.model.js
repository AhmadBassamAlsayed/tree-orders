const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SubOrderItem = sequelize.define('SubOrderItem', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  subOrderId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'sub_order_id' },
  productId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'product_id' },
  variantId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, field: 'variant_id' },
  quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  unitPrice: { type: DataTypes.DECIMAL(20, 4), allowNull: false, field: 'unit_price' },
  groupPurchaseId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, field: 'group_purchase_id' }
}, {
  tableName: 'sub_order_items',
  timestamps: false,
  underscored: true,
  indexes: [{ fields: ['sub_order_id'], name: 'idx_sub_order_items_sub_order_id' }]
});

module.exports = SubOrderItem;
