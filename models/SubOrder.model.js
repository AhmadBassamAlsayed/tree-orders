const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SubOrder = sequelize.define('SubOrder', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  orderId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'order_id' },
  shopId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'shop_id' },
  shopCityId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'shop_city_id' },
  holdId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'hold_id' },
  smallCenterId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, field: 'small_center_id' },
  originHubId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'origin_hub_id' },
  destHubId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'dest_hub_id' },
  status: {
    type: DataTypes.ENUM(
      'pending', 'assigned', 'picked_up', 'at_origin_hub',
      'in_transit', 'at_dest_hub', 'out_for_delivery', 'delivered', 'cancelled'
    ),
    allowNull: false,
    defaultValue: 'pending'
  },
  totalAmount: { type: DataTypes.DECIMAL(20, 4), allowNull: false, field: 'total_amount' }
}, {
  tableName: 'sub_orders',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['order_id'], name: 'idx_sub_orders_order_id' },
    { fields: ['shop_id'], name: 'idx_sub_orders_shop_id' },
    { fields: ['status'], name: 'idx_sub_orders_status' },
    { fields: ['small_center_id'], name: 'idx_sub_orders_small_center_id' },
    { fields: ['origin_hub_id'], name: 'idx_sub_orders_origin_hub_id' },
    { fields: ['dest_hub_id'], name: 'idx_sub_orders_dest_hub_id' }
  ]
});

module.exports = SubOrder;
