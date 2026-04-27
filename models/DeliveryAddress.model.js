const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DeliveryAddress = sequelize.define('DeliveryAddress', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  customerId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'customer_id' },
  cityId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'city_id' },
  street: { type: DataTypes.STRING(255), allowNull: false },
  building: { type: DataTypes.STRING(100), allowNull: true },
  floor: { type: DataTypes.STRING(20), allowNull: true },
  apartment: { type: DataTypes.STRING(20), allowNull: true },
  label: { type: DataTypes.STRING(50), allowNull: true },
  isDefault: { type: DataTypes.TINYINT(1), allowNull: false, defaultValue: 0, field: 'is_default' }
}, {
  tableName: 'delivery_addresses',
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ['customer_id'], name: 'idx_delivery_addresses_customer_id' }]
});

module.exports = DeliveryAddress;
