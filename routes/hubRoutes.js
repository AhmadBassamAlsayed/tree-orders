const express = require('express');
const router = express.Router();
const hubManagerController = require('../controllers/hubManagerController');
const { requireCenterRole } = require('../middlewares/centerAuth');

const workerAuth  = requireCenterRole('main', 'worker', 'manager');
const managerAuth = requireCenterRole('main', 'manager');

router.get('/suborders/incoming',         workerAuth,  hubManagerController.getIncomingSubOrders);
router.patch('/suborders/:id/ship',       workerAuth,  hubManagerController.shipSubOrder);
router.get('/suborders/arrived',          workerAuth,  hubManagerController.getArrivedSubOrders);
router.patch('/suborders/:id/received',   workerAuth,  hubManagerController.receiveSubOrder);
router.patch('/suborders/:id/delivered',  workerAuth,  hubManagerController.deliverSubOrder);
router.get('/orders/ready',               managerAuth, hubManagerController.getReadyOrders);
router.post('/orders/:orderId/dispatch',  managerAuth, hubManagerController.dispatchOrder);

module.exports = router;
