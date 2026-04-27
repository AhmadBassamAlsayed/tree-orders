const { Op } = require('sequelize');
const { City, Center, CenterAssignment, Order, SubOrder } = require('../models/Index');

// Cities
const createCity = async (req, res) => {
  try {
    const { name } = req.body;
    const city = await City.create({ name });
    return res.status(201).json(city);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ error: 'CITY_EXISTS' });
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

const listCities = async (req, res) => {
  try {
    const cities = await City.findAll({ order: [['name', 'ASC']] });
    return res.status(200).json(cities);
  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

// Centers
const createCenter = async (req, res) => {
  try {
    const { type, name, cityId, address, parentHubId } = req.body;

    if (type === 'main') {
      if (parentHubId) return res.status(400).json({ error: 'INVALID_CENTER', message: 'Main center must not have a parentHubId' });
      const existing = await Center.findOne({ where: { cityId, type: 'main' } });
      if (existing) return res.status(409).json({ error: 'MAIN_CENTER_EXISTS', message: 'City already has a main center' });
    }

    if (type === 'small') {
      if (!parentHubId) return res.status(400).json({ error: 'INVALID_CENTER', message: 'Small center requires parentHubId' });
      const hub = await Center.findOne({ where: { id: parentHubId, type: 'main', cityId } });
      if (!hub) return res.status(422).json({ error: 'INVALID_PARENT_HUB', message: 'parentHubId must be a main center in the same city' });
    }

    const center = await Center.create({ type, name, cityId, address, parentHubId: parentHubId || null });
    return res.status(201).json(center);
  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

const listCenters = async (req, res) => {
  try {
    const { cityId, type } = req.query;
    const where = {};
    if (cityId) where.cityId = cityId;
    if (type) where.type = type;
    const centers = await Center.findAll({ where, order: [['name', 'ASC']] });
    return res.status(200).json(centers);
  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

// Workers
const assignWorker = async (req, res) => {
  try {
    const { centerId } = req.params;
    const { userId, role } = req.body;

    const center = await Center.findByPk(centerId);
    if (!center) return res.status(404).json({ error: 'CENTER_NOT_FOUND' });

    const [assignment, created] = await CenterAssignment.findOrCreate({
      where: { userId, centerId },
      defaults: { userId, centerId, role }
    });

    if (!created) return res.status(409).json({ error: 'ALREADY_ASSIGNED', message: 'User is already assigned to this center' });

    return res.status(201).json(assignment);
  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

const removeWorker = async (req, res) => {
  try {
    const { centerId, userId } = req.params;
    const deleted = await CenterAssignment.destroy({ where: { centerId, userId } });
    if (!deleted) return res.status(404).json({ error: 'ASSIGNMENT_NOT_FOUND' });
    return res.status(200).json({ deleted: true });
  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

// SubOrder assignment
const assignSmallCenter = async (req, res) => {
  try {
    const { id } = req.params;
    const { smallCenterId } = req.body;

    const subOrder = await SubOrder.findByPk(id);
    if (!subOrder) return res.status(404).json({ error: 'SUBORDER_NOT_FOUND' });
    if (subOrder.status !== 'pending') return res.status(400).json({ error: 'INVALID_STATUS_TRANSITION' });

    const center = await Center.findOne({ where: { id: smallCenterId, type: 'small' } });
    if (!center) return res.status(404).json({ error: 'CENTER_NOT_FOUND' });
    if (center.cityId !== subOrder.shopCityId) return res.status(422).json({ error: 'WRONG_CENTER_CITY', message: "Small center is not in the shop's city" });

    await subOrder.update({ smallCenterId, status: 'assigned' });
    return res.status(200).json(subOrder);
  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

// Order/SubOrder lists
const listOrders = async (req, res) => {
  try {
    const { status, cityId, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (cityId) where.destinationCityId = cityId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
      if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);
    }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Order.findAndCountAll({ where, limit: parseInt(limit), offset, order: [['createdAt', 'DESC']] });
    return res.status(200).json({ data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count } });
  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

const listSubOrders = async (req, res) => {
  try {
    const { status, shopId, centerId, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (shopId) where.shopId = shopId;
    if (centerId) where[Op.or] = [{ smallCenterId: centerId }, { originHubId: centerId }, { destHubId: centerId }];
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await SubOrder.findAndCountAll({ where, limit: parseInt(limit), offset, order: [['createdAt', 'DESC']] });
    return res.status(200).json({ data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count } });
  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

module.exports = { createCity, listCities, createCenter, listCenters, assignWorker, removeWorker, assignSmallCenter, listOrders, listSubOrders };
