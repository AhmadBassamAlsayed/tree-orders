const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CenterAssignment = sequelize.define('CenterAssignment', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'user_id' },
  centerId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'center_id' },
  role: { type: DataTypes.ENUM('worker', 'manager'), allowNull: false },
  assignedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'assigned_at' }
}, {
  tableName: 'center_assignments',
  timestamps: false,
  underscored: true,
  indexes: [
    { unique: true, fields: ['user_id', 'center_id'], name: 'uq_center_assignments_user_center' },
    { fields: ['center_id'], name: 'idx_center_assignments_center_id' }
  ]
});

module.exports = CenterAssignment;
