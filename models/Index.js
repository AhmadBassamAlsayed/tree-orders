const GroupPurchaseOrder = require('./GroupPurchaseOrder.model');
const City = require('./City.model');
const Center = require('./Center.model');
const CenterAssignment = require('./CenterAssignment.model');
const DeliveryAddress = require('./DeliveryAddress.model');
const Order = require('./Order.model');
const SubOrder = require('./SubOrder.model');
const SubOrderItem = require('./SubOrderItem.model');
const SubOrderStatusLog = require('./SubOrderStatusLog.model');

// Center associations
Center.belongsTo(City,   { foreignKey: 'cityId',      as: 'city' });
City.hasMany(Center,     { foreignKey: 'cityId',      as: 'centers' });

Center.belongsTo(Center, { foreignKey: 'parentHubId', as: 'parentHub' });
Center.hasMany(Center,   { foreignKey: 'parentHubId', as: 'smallCenters' });

Center.hasMany(CenterAssignment, { foreignKey: 'centerId', as: 'assignments' });
CenterAssignment.belongsTo(Center, { foreignKey: 'centerId', as: 'center' });

// DeliveryAddress associations
DeliveryAddress.belongsTo(City,  { foreignKey: 'cityId', as: 'city' });
City.hasMany(DeliveryAddress,    { foreignKey: 'cityId', as: 'deliveryAddresses' });

DeliveryAddress.hasMany(Order,   { foreignKey: 'deliveryAddressId', as: 'orders' });

// Order associations
Order.belongsTo(DeliveryAddress, { foreignKey: 'deliveryAddressId', as: 'deliveryAddress' });
Order.belongsTo(City,            { foreignKey: 'destinationCityId', as: 'destinationCity' });
Order.belongsTo(Center,          { foreignKey: 'destHubId',         as: 'destHub' });
Order.hasMany(SubOrder,          { foreignKey: 'orderId',           as: 'subOrders' });

// SubOrder associations
SubOrder.belongsTo(Order,  { foreignKey: 'orderId',       as: 'order' });
SubOrder.belongsTo(City,   { foreignKey: 'shopCityId',    as: 'shopCity' });
SubOrder.belongsTo(Center, { foreignKey: 'smallCenterId', as: 'smallCenter' });
SubOrder.belongsTo(Center, { foreignKey: 'originHubId',   as: 'originHub' });
SubOrder.belongsTo(Center, { foreignKey: 'destHubId',     as: 'destHub' });
SubOrder.hasMany(SubOrderItem,      { foreignKey: 'subOrderId', as: 'items' });
SubOrder.hasMany(SubOrderStatusLog, { foreignKey: 'subOrderId', as: 'statusLogs' });

SubOrderItem.belongsTo(SubOrder,      { foreignKey: 'subOrderId', as: 'subOrder' });
SubOrderStatusLog.belongsTo(SubOrder, { foreignKey: 'subOrderId', as: 'subOrder' });

module.exports = {
  City, Center, CenterAssignment, DeliveryAddress,
  Order, SubOrder, SubOrderItem, SubOrderStatusLog,
  GroupPurchaseOrder
};
