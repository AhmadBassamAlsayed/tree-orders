const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.get('/',    orderController.listOrders);
router.get('/:id', orderController.getOrder);
router.patch('/:orderId/suborders/:subOrderId/cancel', orderController.cancelSubOrder);

module.exports = router;
