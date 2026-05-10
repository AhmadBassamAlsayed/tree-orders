const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GroupPurchaseOrder = sequelize.define('GroupPurchaseOrder', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  dealId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'deal_id' },
  userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'user_id' },
  shopId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'shop_id' },
  productId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'product_id' },
  quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  unitPrice: { type: DataTypes.DECIMAL(20, 4), allowNull: false, field: 'unit_price' },
  totalAmount: { type: DataTypes.DECIMAL(20, 4), allowNull: false, field: 'total_amount' },
  status: {
    type: DataTypes.ENUM('confirmed'),
    allowNull: false,
    defaultValue: 'confirmed'
  }
}, {
  tableName: 'group_purchase_orders',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['deal_id'],  name: 'idx_gpo_deal_id' },
    { fields: ['user_id'],  name: 'idx_gpo_user_id' },
    { fields: ['shop_id'],  name: 'idx_gpo_shop_id' }
  ]
});

module.exports = GroupPurchaseOrder;
