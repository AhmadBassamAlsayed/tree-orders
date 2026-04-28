const express = require('express');
const router = express.Router();
const centerWorkerController = require('../controllers/centerWorkerController');
const { requireCenterRole } = require('../middlewares/centerAuth');

const workerAuth = requireCenterRole('small', 'worker', 'manager');

/**
 * @swagger
 * /api/center/suborders:
 *   get:
 *     summary: List SubOrders assigned to the caller's small center
 *     description: |
 *       Returns SubOrders whose `smallCenterId` matches the center of the
 *       authenticated user. Defaults to `status=assigned`. Only users with a
 *       `worker` or `manager` role at a **small** center can call this endpoint.
 *
 *       **Center auth**: `requireCenterRole('small', 'worker', 'manager')` is
 *       applied. The middleware validates that the user has a CenterAssignment,
 *       that the role is `worker` or `manager`, and that the assigned center is
 *       of type `small`. On success it injects `req.center` and `req.centerRole`.
 *     tags:
 *       - Center (Small Center Workers)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - pending
 *             - assigned
 *             - picked_up
 *             - at_origin_hub
 *             - in_transit
 *             - at_dest_hub
 *             - out_for_delivery
 *             - delivered
 *             - cancelled
 *           default: assigned
 *         description: Filter SubOrders by status.
 *     responses:
 *       200:
 *         description: List of SubOrders assigned to the caller's small center.
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
 *           - `UNAUTHORIZED_CENTER` — no center assignment, insufficient role, or wrong center type.
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
 *                   message: "Requires a small center assignment"
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
router.get('/suborders',           workerAuth, centerWorkerController.listAssignedSubOrders);

/**
 * @swagger
 * /api/center/suborders/{id}/pickup:
 *   patch:
 *     summary: Mark a SubOrder as picked up
 *     description: |
 *       Transitions a SubOrder from `assigned` → `picked_up`. The SubOrder must
 *       be assigned to the caller's small center. After the status update the
 *       parent Order's status is recalculated.
 *
 *       **Center auth**: `requireCenterRole('small', 'worker', 'manager')`.
 *     tags:
 *       - Center (Small Center Workers)
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
 *         description: SubOrder updated. Returns the full updated SubOrder record.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubOrder'
 *       400:
 *         description: SubOrder is not in `assigned` status.
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
 *           Center authorization failed or SubOrder not assigned to caller's center.
 *           - `UNAUTHORIZED_CENTER` — no assignment, wrong role, wrong center type,
 *             or SubOrder belongs to a different center.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               centerAuthFailed:
 *                 value:
 *                   error: "UNAUTHORIZED_CENTER"
 *                   message: "No center assignment found"
 *               wrongCenter:
 *                 value:
 *                   error: "UNAUTHORIZED_CENTER"
 *                   message: "SubOrder not assigned to your center"
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
router.patch('/suborders/:id/pickup',  workerAuth, centerWorkerController.pickupSubOrder);

/**
 * @swagger
 * /api/center/suborders/{id}/handoff:
 *   patch:
 *     summary: Hand off a SubOrder to the origin hub
 *     description: |
 *       Transitions a SubOrder from `picked_up` → `at_origin_hub`. The SubOrder
 *       must be assigned to the caller's small center. After the status update the
 *       parent Order's status is recalculated.
 *
 *       **Center auth**: `requireCenterRole('small', 'worker', 'manager')`.
 *     tags:
 *       - Center (Small Center Workers)
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
 *         description: SubOrder updated. Returns the full updated SubOrder record.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubOrder'
 *       400:
 *         description: SubOrder is not in `picked_up` status.
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
 *           Center authorization failed or SubOrder not assigned to caller's center.
 *           - `UNAUTHORIZED_CENTER` — no assignment, wrong role, wrong center type,
 *             or SubOrder belongs to a different center.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               centerAuthFailed:
 *                 value:
 *                   error: "UNAUTHORIZED_CENTER"
 *                   message: "No center assignment found"
 *               wrongCenter:
 *                 value:
 *                   error: "UNAUTHORIZED_CENTER"
 *                   message: "SubOrder not assigned to your center"
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
router.patch('/suborders/:id/handoff', workerAuth, centerWorkerController.handoffSubOrder);

module.exports = router;
