const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Center = sequelize.define('Center', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  type: { type: DataTypes.ENUM('small', 'main'), allowNull: false },
  name: { type: DataTypes.STRING(150), allowNull: false },
  cityId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'city_id' },
  address: { type: DataTypes.TEXT, allowNull: false },
  parentHubId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, field: 'parent_hub_id' }
}, {
  tableName: 'centers',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['city_id'], name: 'idx_centers_city_id' },
    { fields: ['type'], name: 'idx_centers_type' }
  ]
});

module.exports = Center;
