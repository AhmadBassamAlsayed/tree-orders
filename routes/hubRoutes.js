const express = require('express');
const router = express.Router();
const hubManagerController = require('../controllers/hubManagerController');
const { requireCenterRole } = require('../middlewares/centerAuth');

const workerAuth  = requireCenterRole('main', 'worker', 'manager');
const managerAuth = requireCenterRole('main', 'manager');

/**
 * @swagger
 * /api/hub/suborders/incoming:
 *   get:
 *     summary: List SubOrders that have arrived at the origin hub
 *     description: |
 *       Returns all SubOrders with `status=at_origin_hub` whose `originHubId`
 *       matches the caller's main hub center. These are SubOrders that small
 *       center workers have already handed off and are waiting to be shipped.
 *
 *       **Center auth**: `requireCenterRole('main', 'worker', 'manager')`.
 *     tags:
 *       - Hub (Main Hub Workers)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of SubOrders at the origin hub.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SubOrder'
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
 *         description: |
 *           Center authorization failed. Possible error codes:
 *           - `UNAUTHORIZED_CENTER` — no assignment, insufficient role, or wrong center type.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               noAssignment:
 *                 value:
 *                   error: "UNAUTHORIZED_CENTER"
 *                   message: "No center assignment found"
 *               insufficientRole:
 *                 value:
 *                   error: "UNAUTHORIZED_CENTER"
 *                   message: "Insufficient center role"
 *               wrongType:
 *                 value:
 *                   error: "UNAUTHORIZED_CENTER"
 *                   message: "Requires a main center assignment"
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
router.get('/suborders/incoming',         workerAuth,  hubManagerController.getIncomingSubOrders);

/**
 * @swagger
 * /api/hub/suborders/{id}/ship:
 *   patch:
 *     summary: Ship a SubOrder from the origin hub
 *     description: |
 *       Transitions a SubOrder from `at_origin_hub` to either `in_transit` or
 *       `out_for_delivery`. If the origin hub and destination hub are the same
 *       center (local order), the status jumps directly to `out_for_delivery`,
 *       bypassing the `in_transit` stage. The SubOrder must have `originHubId`
 *       matching the caller's hub.
 *
 *       **Center auth**: `requireCenterRole('main', 'worker', 'manager')`.
 *     tags:
 *       - Hub (Main Hub Workers)
 *     security:
 *       - bearerAuth: []
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
 *         description: SubOrder shipped. Returns the full updated SubOrder record.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubOrder'
 *       400:
 *         description: SubOrder is not in `at_origin_hub` status.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "INVALID_STATUS_TRANSITION"
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
 *         description: |
 *           Center authorization failed or SubOrder not from caller's hub.
 *           - `UNAUTHORIZED_CENTER` — various reasons.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "UNAUTHORIZED_CENTER"
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
router.patch('/suborders/:id/ship',       workerAuth,  hubManagerController.shipSubOrder);

/**
 * @swagger
 * /api/hub/suborders/arrived:
 *   get:
 *     summary: List SubOrders that have arrived at the destination hub
 *     description: |
 *       Returns all SubOrders with `status=at_dest_hub` whose `destHubId` matches
 *       the caller's main hub center. These are SubOrders that have been received
 *       at this hub and are waiting to be dispatched.
 *
 *       **Center auth**: `requireCenterRole('main', 'worker', 'manager')`.
 *     tags:
 *       - Hub (Main Hub Workers)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of SubOrders at the destination hub.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SubOrder'
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
 *         description: Center authorization failed.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "UNAUTHORIZED_CENTER"
 *               message: "Requires a main center assignment"
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
router.get('/suborders/arrived',          workerAuth,  hubManagerController.getArrivedSubOrders);

/**
 * @swagger
 * /api/hub/suborders/{id}/received:
 *   patch:
 *     summary: Mark a SubOrder as received at the destination hub
 *     description: |
 *       Transitions a SubOrder from `in_transit` → `at_dest_hub`. The SubOrder
 *       must have `destHubId` matching the caller's main hub center.
 *
 *       **Center auth**: `requireCenterRole('main', 'worker', 'manager')`.
 *     tags:
 *       - Hub (Main Hub Workers)
 *     security:
 *       - bearerAuth: []
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
 *         description: SubOrder received. Returns the full updated SubOrder record.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubOrder'
 *       400:
 *         description: SubOrder is not in `in_transit` status.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "INVALID_STATUS_TRANSITION"
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
 *         description: Center authorization failed or SubOrder not destined for caller's hub.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "UNAUTHORIZED_CENTER"
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
router.patch('/suborders/:id/received',   workerAuth,  hubManagerController.receiveSubOrder);

/**
 * @swagger
 * /api/hub/suborders/{id}/delivered:
 *   patch:
 *     summary: Mark a SubOrder as delivered to the customer
 *     description: |
 *       Transitions a SubOrder from `out_for_delivery` → `delivered`. Before
 *       updating the status, the endpoint captures the payment hold in
 *       tree-financial and transfers funds to the shop's account. If hold
 *       capture fails, the SubOrder is NOT marked delivered. The SubOrder must
 *       have `destHubId` matching the caller's main hub center.
 *
 *       **Center auth**: `requireCenterRole('main', 'worker', 'manager')`.
 *     tags:
 *       - Hub (Main Hub Workers)
 *     security:
 *       - bearerAuth: []
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
 *         description: SubOrder delivered and payment captured. Returns the SubOrder's new status and the recalculated order status.
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
 *                       example: "delivered"
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
 *                       example: "delivered"
 *       400:
 *         description: SubOrder is not in `out_for_delivery` status.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "SUBORDER_NOT_OUT_FOR_DELIVERY"
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
 *         description: Center authorization failed or SubOrder not destined for caller's hub.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "UNAUTHORIZED_CENTER"
 *       404:
 *         description: SubOrder not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "SUBORDER_NOT_FOUND"
 *       500:
 *         description: |
 *           Server-side failure. Possible error codes:
 *           - `CAPTURE_FAILED` — could not fetch the shop's account or hold capture failed.
 *           - `INTERNAL_ERROR` — unexpected server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               captureFailed:
 *                 value:
 *                   error: "CAPTURE_FAILED"
 *                   message: "Hold capture failed; SubOrder not marked delivered"
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
router.patch('/suborders/:id/delivered',  workerAuth,  hubManagerController.deliverSubOrder);

/**
 * @swagger
 * /api/hub/orders/ready:
 *   get:
 *     summary: List orders ready to dispatch from the destination hub
 *     description: |
 *       Returns Orders whose `destHubId` matches the caller's main hub and where
 *       all non-cancelled SubOrders have reached `at_dest_hub` or `delivered`
 *       status. These orders are ready to be dispatched out for delivery.
 *
 *       **Center auth**: `requireCenterRole('main', 'manager')`.
 *     tags:
 *       - Hub (Main Hub Managers)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders ready to dispatch.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   orderId:
 *                     type: integer
 *                     format: int64
 *                     example: 8
 *                   customerId:
 *                     type: integer
 *                     format: int64
 *                     example: 101
 *                   subOrders:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           format: int64
 *                           example: 20
 *                         shopId:
 *                           type: integer
 *                           format: int64
 *                           example: 5
 *                         status:
 *                           type: string
 *                           example: "at_dest_hub"
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
 *         description: |
 *           Center authorization failed. Must be a `manager` at a `main` center.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               noAssignment:
 *                 value:
 *                   error: "UNAUTHORIZED_CENTER"
 *                   message: "No center assignment found"
 *               insufficientRole:
 *                 value:
 *                   error: "UNAUTHORIZED_CENTER"
 *                   message: "Insufficient center role"
 *               wrongType:
 *                 value:
 *                   error: "UNAUTHORIZED_CENTER"
 *                   message: "Requires a main center assignment"
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
router.get('/orders/ready',               managerAuth, hubManagerController.getReadyOrders);

/**
 * @swagger
 * /api/hub/orders/{orderId}/dispatch:
 *   post:
 *     summary: Dispatch an order out for delivery
 *     description: |
 *       Transitions all non-cancelled SubOrders of an order from `at_dest_hub`
 *       → `out_for_delivery` in a single transaction. All non-cancelled SubOrders
 *       must be in `at_dest_hub` status; if any are not, the operation is rejected
 *       with `ORDER_NOT_READY_TO_DISPATCH`. The order's `destHubId` must match the
 *       caller's main hub center. The parent Order's status is recalculated after.
 *
 *       **Center auth**: `requireCenterRole('main', 'manager')`.
 *     tags:
 *       - Hub (Main Hub Managers)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         description: Order ID to dispatch.
 *         example: 8
 *     responses:
 *       200:
 *         description: Order dispatched. Returns the full Order record with the updated status.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
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
 *         description: Center authorization failed or order not destined for caller's hub.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "UNAUTHORIZED_CENTER"
 *       404:
 *         description: Order not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "ORDER_NOT_FOUND"
 *       409:
 *         description: Not all SubOrders have arrived at the destination hub yet.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "ORDER_NOT_READY_TO_DISPATCH"
 *               message: "Some SubOrders have not arrived yet"
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
router.post('/orders/:orderId/dispatch',  managerAuth, hubManagerController.dispatchOrder);

module.exports = router;
