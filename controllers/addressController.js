const { Op } = require('sequelize');
const { DeliveryAddress, Order, City } = require('../models/Index');

const createAddress = async (req, res) => {
  try {
    const { cityId, street, building, floor, apartment, label, isDefault } = req.body;

    const city = await City.findByPk(cityId);
    if (!city) return res.status(404).json({ error: 'CITY_NOT_FOUND' });

    if (isDefault) {
      await DeliveryAddress.update({ isDefault: 0 }, { where: { customerId: req.userId } });
    }

    const address = await DeliveryAddress.create({
      customerId: req.userId, cityId, street, building, floor, apartment, label,
      isDefault: isDefault ? 1 : 0
    });

    return res.status(201).json(address);
  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

const listAddresses = async (req, res) => {
  try {
    const addresses = await DeliveryAddress.findAll({
      where: { customerId: req.userId },
      order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
    });
    return res.status(200).json(addresses);
  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

const updateAddress = async (req, res) => {
  try {
    const address = await DeliveryAddress.findOne({ where: { id: req.params.id, customerId: req.userId } });
    if (!address) return res.status(404).json({ error: 'ADDRESS_NOT_FOUND' });

    const { isDefault, ...rest } = req.body;
    if (isDefault) {
      await DeliveryAddress.update({ isDefault: 0 }, { where: { customerId: req.userId } });
    }
    await address.update({ ...rest, ...(isDefault !== undefined ? { isDefault: isDefault ? 1 : 0 } : {}) });
    return res.status(200).json(address);
  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const address = await DeliveryAddress.findOne({ where: { id: req.params.id, customerId: req.userId } });
    if (!address) return res.status(404).json({ error: 'ADDRESS_NOT_FOUND' });

    const activeOrder = await Order.findOne({
      where: {
        deliveryAddressId: address.id,
        status: { [Op.notIn]: ['delivered', 'cancelled'] }
      }
    });
    if (activeOrder) return res.status(409).json({ error: 'ADDRESS_IN_USE', message: 'Address is referenced by an active order' });

    await address.destroy();
    return res.status(200).json({ deleted: true });
  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

module.exports = { createAddress, listAddresses, updateAddress, deleteAddress };
