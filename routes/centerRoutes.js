const express = require('express');
const router = express.Router();
const centerWorkerController = require('../controllers/centerWorkerController');
const { requireCenterRole } = require('../middlewares/centerAuth');

const workerAuth = requireCenterRole('small', 'worker', 'manager');

router.get('/suborders',           workerAuth, centerWorkerController.listAssignedSubOrders);
router.patch('/suborders/:id/pickup',  workerAuth, centerWorkerController.pickupSubOrder);
router.patch('/suborders/:id/handoff', workerAuth, centerWorkerController.handoffSubOrder);

module.exports = router;
