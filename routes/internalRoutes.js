const express = require('express');
const router = express.Router();
const internalAuth = require('../middlewares/internalAuth');
const internalController = require('../controllers/internalController');

router.use(internalAuth);

router.get('/orders/:id',    internalController.getOrder);
router.get('/suborders/:id', internalController.getSubOrder);

module.exports = router;
