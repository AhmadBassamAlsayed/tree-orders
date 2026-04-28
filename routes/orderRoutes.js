const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: List the authenticated customer's orders
 *     description: |
 *       Returns a paginated list of orders belonging to the authenticated customer.
 *       Orders are sorted by creation date descending. An optional `status` filter
 *       can narrow results. Each entry includes a `subOrderCount` for quick inspection.
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (1-based).
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of orders per page.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, in_transit, delivered, cancelled]
 *         description: Filter orders by status.
 *     responses:
 *       200:
 *         description: Paginated list of orders.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         format: int64
 *                         example: 8
 *                       status:
 *                         type: string
 *                         enum: [pending, processing, in_transit, delivered, cancelled]
 *                         example: "pending"
 *                       totalAmount:
 *                         type: number
 *                         format: double
 *                         example: 9000.0000
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       subOrderCount:
 *                         type: integer
 *                         description: Number of SubOrders in this order.
 *                         example: 2
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Missing or invalid Bearer token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Access token is required"
 *       500:
 *         description: Unexpected server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "INTERNAL_ERROR"
 *               message: "Unexpected database error"
 *       503:
 *         description: SSO authentication service is unreachable.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Authentication service unavailable"
 */
router.get('/',    orderController.listOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get a single order by ID
 *     description: |
 *       Returns full detail for an order including its delivery address and
 *       all SubOrders (each with their items). The authenticated customer must
 *       own the order; otherwise 403 is returned.
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
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
 *         description: Order detail.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   format: int64
 *                   example: 8
 *                 status:
 *                   type: string
 *                   enum: [pending, processing, in_transit, delivered, cancelled]
 *                   example: "pending"
 *                 totalAmount:
 *                   type: number
 *                   format: double
 *                   example: 9000.0000
 *                 deliveryAddress:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     street:
 *                       type: string
 *                       example: "Omar Al-Mukhtar Street"
 *                     cityId:
 *                       type: integer
 *                       format: int64
 *                       example: 1
 *                 subOrders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SubOrder'
 *       401:
 *         description: Missing or invalid Bearer token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Access token is required"
 *       403:
 *         description: The order does not belong to the authenticated customer.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "FORBIDDEN"
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
 *       503:
 *         description: SSO authentication service is unreachable.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Authentication service unavailable"
 */
router.get('/:id', orderController.getOrder);

/**
 * @swagger
 * /api/orders/{orderId}/suborders/{subOrderId}/cancel:
 *   patch:
 *     summary: Cancel a SubOrder
 *     description: |
 *       Allows the owning customer to cancel a SubOrder that is still in `pending`
 *       or `assigned` status. The payment hold is released in tree-financial before
 *       the status is updated. If hold release fails, the SubOrder is NOT cancelled.
 *       After cancellation, the parent Order's status is recalculated automatically.
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         description: Parent order ID.
 *         example: 8
 *       - in: path
 *         name: subOrderId
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         description: SubOrder ID to cancel.
 *         example: 20
 *     responses:
 *       200:
 *         description: SubOrder cancelled and order status recalculated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subOrder:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       format: int64
 *                       example: 20
 *                     status:
 *                       type: string
 *                       example: "cancelled"
 *                 order:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       format: int64
 *                       example: 8
 *                     status:
 *                       type: string
 *                       enum: [pending, processing, in_transit, delivered, cancelled]
 *                       example: "cancelled"
 *       400:
 *         description: SubOrder has already been picked up and cannot be cancelled.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "SUBORDER_ALREADY_PICKED_UP"
 *               message: "Cannot cancel after pickup"
 *       401:
 *         description: Missing or invalid Bearer token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Access token is required"
 *       403:
 *         description: The order does not belong to the authenticated customer.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "FORBIDDEN"
 *       404:
 *         description: Order or SubOrder not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               orderNotFound:
 *                 value:
 *                   error: "ORDER_NOT_FOUND"
 *               subOrderNotFound:
 *                 value:
 *                   error: "SUBORDER_NOT_FOUND"
 *       500:
 *         description: |
 *           Server-side failure. Possible error codes:
 *           - `RELEASE_FAILED` — hold release failed in tree-financial; SubOrder not cancelled.
 *           - `INTERNAL_ERROR` — unexpected server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               releaseFailed:
 *                 value:
 *                   error: "RELEASE_FAILED"
 *                   message: "Hold release failed; SubOrder not cancelled"
 *               internalError:
 *                 value:
 *                   error: "INTERNAL_ERROR"
 *                   message: "Unexpected database error"
 *       503:
 *         description: SSO authentication service is unreachable.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Authentication service unavailable"
 */
router.patch('/:orderId/suborders/:subOrderId/cancel', orderController.cancelSubOrder);

module.exports = router;
