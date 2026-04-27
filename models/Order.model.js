const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  customerId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'customer_id' },
  cartId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'cart_id' },
  deliveryAddressId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'delivery_address_id' },
  destinationCityId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'destination_city_id' },
  destHubId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'dest_hub_id' },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'in_transit', 'delivered', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  },
  totalAmount: { type: DataTypes.DECIMAL(20, 4), allowNull: false, field: 'total_amount' }
}, {
  tableName: 'orders',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['customer_id'], name: 'idx_orders_customer_id' },
    { fields: ['status'], name: 'idx_orders_status' },
    { fields: ['destination_city_id'], name: 'idx_orders_destination_city_id' }
  ]
});

module.exports = Order;
