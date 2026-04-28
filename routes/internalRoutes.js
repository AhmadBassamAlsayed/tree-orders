const express = require('express');
const router = express.Router();
const internalAuth = require('../middlewares/internalAuth');
const internalController = require('../controllers/internalController');

router.use(internalAuth);

/**
 * @swagger
 * /api/internal/orders/{id}:
 *   get:
 *     summary: Get an order by ID (internal service-to-service)
 *     description: |
 *       Returns a single Order record by primary key. This endpoint is intended
 *       exclusively for service-to-service calls (e.g. from tree-shops or
 *       tree-financial). It is **not** protected by a Bearer token; instead it
 *       requires the `X-Internal-Secret` header to match the shared
 *       `INTERNAL_API_SECRET` environment variable. No Bearer token is expected
 *       or checked.
 *
 *       The response shape is a flat projection of the Order model (no nested
 *       associations).
 *     tags:
 *       - Internal
 *     security:
 *       - internalSecret: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         description: Order ID.
 *         example: 8
 *     responses:
 *       200:
 *         description: Order found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   format: int64
 *                   example: 8
 *                 customerId:
 *                   type: integer
 *                   format: int64
 *                   example: 101
 *                 cartId:
 *                   type: integer
 *                   format: int64
 *                   example: 15
 *                 destinationCityId:
 *                   type: integer
 *                   format: int64
 *                   example: 1
 *                 destHubId:
 *                   type: integer
 *                   format: int64
 *                   example: 3
 *                 status:
 *                   type: string
 *                   enum: [pending, processing, in_transit, delivered, cancelled]
 *                   example: "pending"
 *                 totalAmount:
 *                   type: number
 *                   format: double
 *                   example: 9000.0000
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Missing or invalid X-Internal-Secret header.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "UNAUTHORIZED"
 *               message: "Invalid internal secret"
 *       404:
 *         description: Order not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "ORDER_NOT_FOUND"
 *       500:
 *         description: Unexpected server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "INTERNAL_ERROR"
 *               message: "Unexpected database error"
 */
router.get('/orders/:id',    internalController.getOrder);

/**
 * @swagger
 * /api/internal/suborders/{id}:
 *   get:
 *     summary: Get a SubOrder by ID (internal service-to-service)
 *     description: |
 *       Returns a single SubOrder record by primary key. This endpoint is intended
 *       exclusively for service-to-service calls. It requires the
 *       `X-Internal-Secret` header and does **not** check a Bearer token.
 *
 *       The response is a flat projection including financial references such as
 *       `holdId` that are not exposed to customers.
 *     tags:
 *       - Internal
 *     security:
 *       - internalSecret: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         description: SubOrder ID.
 *         example: 20
 *     responses:
 *       200:
 *         description: SubOrder found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   format: int64
 *                   example: 20
 *                 orderId:
 *                   type: integer
 *                   format: int64
 *                   example: 8
 *                 shopId:
 *                   type: integer
 *                   format: int64
 *                   example: 5
 *                 shopCityId:
 *                   type: integer
 *                   format: int64
 *                   example: 2
 *                 holdId:
 *                   type: integer
 *                   format: int64
 *                   example: 99
 *                 smallCenterId:
 *                   type: integer
 *                   format: int64
 *                   nullable: true
 *                   example: null
 *                 originHubId:
 *                   type: integer
 *                   format: int64
 *                   example: 4
 *                 destHubId:
 *                   type: integer
 *                   format: int64
 *                   example: 3
 *                 status:
 *                   type: string
 *                   enum:
 *                     - pending
 *                     - assigned
 *                     - picked_up
 *                     - at_origin_hub
 *                     - in_transit
 *                     - at_dest_hub
 *                     - out_for_delivery
 *                     - delivered
 *                     - cancelled
 *                   example: "in_transit"
 *                 totalAmount:
 *                   type: number
 *                   format: double
 *                   example: 9000.0000
 *       401:
 *         description: Missing or invalid X-Internal-Secret header.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "UNAUTHORIZED"
 *               message: "Invalid internal secret"
 *       404:
 *         description: SubOrder not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "SUBORDER_NOT_FOUND"
 *       500:
 *         description: Unexpected server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "INTERNAL_ERROR"
 *               message: "Unexpected database error"
 */
router.get('/suborders/:id', internalController.getSubOrder);

module.exports = router;
