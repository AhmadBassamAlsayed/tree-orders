const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middlewares/centerAuth');

router.use(requireAdmin);

router.post('/cities',    adminController.createCity);
router.get('/cities',     adminController.listCities);

router.post('/centers',   adminController.createCenter);
router.get('/centers',    adminController.listCenters);

router.post('/centers/:centerId/workers',          adminController.assignWorker);
router.delete('/centers/:centerId/workers/:userId', adminController.removeWorker);

router.patch('/suborders/:id/assign', adminController.assignSmallCenter);

router.get('/orders',    adminController.listOrders);
router.get('/suborders', adminController.listSubOrders);

module.exports = router;
