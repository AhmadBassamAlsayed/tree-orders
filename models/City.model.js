const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const City = sequelize.define('City', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false }
}, {
  tableName: 'cities',
  timestamps: true,
  underscored: true,
  indexes: [{ unique: true, fields: ['name'], name: 'uq_cities_name' }]
});

module.exports = City;
