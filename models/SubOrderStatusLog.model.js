const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SubOrderStatusLog = sequelize.define('SubOrderStatusLog', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  subOrderId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'sub_order_id' },
  fromStatus: { type: DataTypes.STRING(30), allowNull: true, field: 'from_status' },
  toStatus: { type: DataTypes.STRING(30), allowNull: false, field: 'to_status' },
  changedBy: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'changed_by' },
  changedByRole: { type: DataTypes.STRING(30), allowNull: false, field: 'changed_by_role' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdAt: { type: DataTypes.DATE, allowNull: false, field: 'created_at', defaultValue: () => new Date() }
}, {
  tableName: 'sub_order_status_logs',
  timestamps: false,
  underscored: true,
  indexes: [{ fields: ['sub_order_id'], name: 'idx_sub_order_status_logs_sub_order_id' }]
});

module.exports = SubOrderStatusLog;
