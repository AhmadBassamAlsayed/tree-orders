const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middlewares/centerAuth');

router.use(requireAdmin);

/**
 * @swagger
 * /api/admin/cities:
 *   post:
 *     summary: Create a city
 *     description: |
 *       Creates a new city in the platform. City names must be unique.
 *       All admin routes require the authenticated user to have `role=admin`
 *       (verified by the SSO token); otherwise 403 is returned.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Unique city name.
 *                 example: "Damascus"
 *     responses:
 *       201:
 *         description: City created. Returns the full city record.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/City'
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
 *         description: Authenticated user is not an admin.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "FORBIDDEN"
 *               message: "Admin access required"
 *       409:
 *         description: A city with this name already exists.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "CITY_EXISTS"
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
router.post('/cities',    adminController.createCity);

/**
 * @swagger
 * /api/admin/cities:
 *   get:
 *     summary: List all cities
 *     description: Returns all cities ordered alphabetically by name.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of cities.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/City'
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
 *         description: Authenticated user is not an admin.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "FORBIDDEN"
 *               message: "Admin access required"
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
router.get('/cities',     adminController.listCities);

/**
 * @swagger
 * /api/admin/centers:
 *   post:
 *     summary: Create a center (hub or small center)
 *     description: |
 *       Creates a logistics center. There are two types:
 *       - **`main`** — a city-level hub. Only one main center is allowed per city.
 *         Must **not** include `parentHubId`.
 *       - **`small`** — a local pickup center that feeds a main hub.
 *         **Must** include `parentHubId` pointing to a main center in the same city.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - name
 *               - cityId
 *               - address
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [small, main]
 *                 description: Center type.
 *                 example: "small"
 *               name:
 *                 type: string
 *                 maxLength: 150
 *                 description: Center name.
 *                 example: "Yarmouk Collection Point"
 *               cityId:
 *                 type: integer
 *                 format: int64
 *                 description: City this center belongs to.
 *                 example: 1
 *               address:
 *                 type: string
 *                 description: Physical address of the center.
 *                 example: "Yarmouk Camp, Damascus"
 *               parentHubId:
 *                 type: integer
 *                 format: int64
 *                 nullable: true
 *                 description: Required for type=small. Must be a main center in the same city.
 *                 example: 3
 *           examples:
 *             mainHub:
 *               summary: Create a main hub
 *               value:
 *                 type: "main"
 *                 name: "Damascus Main Hub"
 *                 cityId: 1
 *                 address: "Al-Mazzeh, Damascus"
 *             smallCenter:
 *               summary: Create a small center
 *               value:
 *                 type: "small"
 *                 name: "Yarmouk Collection Point"
 *                 cityId: 1
 *                 address: "Yarmouk Camp, Damascus"
 *                 parentHubId: 3
 *     responses:
 *       201:
 *         description: Center created. Returns the full center record.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Center'
 *       400:
 *         description: |
 *           Invalid center configuration. Possible error codes:
 *           - `INVALID_CENTER` — main center has a parentHubId, or small center is missing parentHubId.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               mainWithParent:
 *                 value:
 *                   error: "INVALID_CENTER"
 *                   message: "Main center must not have a parentHubId"
 *               smallWithoutParent:
 *                 value:
 *                   error: "INVALID_CENTER"
 *                   message: "Small center requires parentHubId"
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
 *         description: Authenticated user is not an admin.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "FORBIDDEN"
 *               message: "Admin access required"
 *       409:
 *         description: City already has a main center.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "MAIN_CENTER_EXISTS"
 *               message: "City already has a main center"
 *       422:
 *         description: parentHubId is not a main center in the same city.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "INVALID_PARENT_HUB"
 *               message: "parentHubId must be a main center in the same city"
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
router.post('/centers',   adminController.createCenter);

/**
 * @swagger
 * /api/admin/centers:
 *   get:
 *     summary: List centers
 *     description: Returns all centers, optionally filtered by `cityId` and/or `type`. Results are ordered alphabetically by name.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cityId
 *         schema:
 *           type: integer
 *           format: int64
 *         description: Filter by city ID.
 *         example: 1
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [small, main]
 *         description: Filter by center type.
 *         example: "main"
 *     responses:
 *       200:
 *         description: Array of centers.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Center'
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
 *         description: Authenticated user is not an admin.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "FORBIDDEN"
 *               message: "Admin access required"
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
router.get('/centers',    adminController.listCenters);

/**
 * @swagger
 * /api/admin/centers/{centerId}/workers:
 *   post:
 *     summary: Assign a worker to a center
 *     description: |
 *       Creates a CenterAssignment linking a user to a center with a given role.
 *       Each user can be assigned to at most one center (unique constraint on
 *       userId + centerId). The user's account is managed in tree-sso; only
 *       the userId is referenced here.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: centerId
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         description: Center ID to assign the worker to.
 *         example: 3
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - role
 *             properties:
 *               userId:
 *                 type: integer
 *                 format: int64
 *                 description: User ID from tree-sso.
 *                 example: 42
 *               role:
 *                 type: string
 *                 enum: [worker, manager]
 *                 description: Role to assign.
 *                 example: "worker"
 *     responses:
 *       201:
 *         description: Assignment created. Returns the CenterAssignment record.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CenterAssignment'
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
 *         description: Authenticated user is not an admin.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "FORBIDDEN"
 *               message: "Admin access required"
 *       404:
 *         description: Center not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "CENTER_NOT_FOUND"
 *       409:
 *         description: User is already assigned to this center.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "ALREADY_ASSIGNED"
 *               message: "User is already assigned to this center"
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
router.post('/centers/:centerId/workers',          adminController.assignWorker);

/**
 * @swagger
 * /api/admin/centers/{centerId}/workers/{userId}:
 *   delete:
 *     summary: Remove a worker from a center
 *     description: Deletes the CenterAssignment for the given user/center pair.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: centerId
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         description: Center ID.
 *         example: 3
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         description: User ID.
 *         example: 42
 *     responses:
 *       200:
 *         description: Assignment removed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deleted:
 *                   type: boolean
 *                   example: true
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
 *         description: Authenticated user is not an admin.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "FORBIDDEN"
 *               message: "Admin access required"
 *       404:
 *         description: No assignment exists for this user/center pair.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "ASSIGNMENT_NOT_FOUND"
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
router.delete('/centers/:centerId/workers/:userId', adminController.removeWorker);

/**
 * @swagger
 * /api/admin/suborders/{id}/assign:
 *   patch:
 *     summary: Assign a SubOrder to a small center
 *     description: |
 *       Sets the `smallCenterId` on a SubOrder and transitions its status from
 *       `pending` → `assigned`. The small center must exist, be of type `small`,
 *       and be located in the same city as the shop (`shopCityId`).
 *     tags:
 *       - Admin
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - smallCenterId
 *             properties:
 *               smallCenterId:
 *                 type: integer
 *                 format: int64
 *                 description: ID of the small center to assign.
 *                 example: 6
 *     responses:
 *       200:
 *         description: SubOrder assigned. Returns the updated SubOrder record.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubOrder'
 *       400:
 *         description: SubOrder is not in `pending` status.
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
 *         description: Authenticated user is not an admin.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "FORBIDDEN"
 *               message: "Admin access required"
 *       404:
 *         description: SubOrder or center not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               subOrderNotFound:
 *                 value:
 *                   error: "SUBORDER_NOT_FOUND"
 *               centerNotFound:
 *                 value:
 *                   error: "CENTER_NOT_FOUND"
 *       422:
 *         description: Small center is not in the shop's city.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "WRONG_CENTER_CITY"
 *               message: "Small center is not in the shop's city"
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
router.patch('/suborders/:id/assign', adminController.assignSmallCenter);

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: List all orders (admin view)
 *     description: |
 *       Returns a paginated list of all orders across all customers. Supports
 *       filtering by `status`, `cityId` (destination city), and date range.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, in_transit, delivered, cancelled]
 *         description: Filter by order status.
 *       - in: query
 *         name: cityId
 *         schema:
 *           type: integer
 *           format: int64
 *         description: Filter by destination city ID.
 *         example: 1
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter orders created on or after this date-time (ISO 8601).
 *         example: "2025-01-01T00:00:00.000Z"
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter orders created on or before this date-time (ISO 8601).
 *         example: "2025-12-31T23:59:59.000Z"
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
 *         description: Number of results per page.
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
 *                     $ref: '#/components/schemas/Order'
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
 *       403:
 *         description: Authenticated user is not an admin.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "FORBIDDEN"
 *               message: "Admin access required"
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
router.get('/orders',    adminController.listOrders);

/**
 * @swagger
 * /api/admin/suborders:
 *   get:
 *     summary: List all SubOrders (admin view)
 *     description: |
 *       Returns a paginated list of all SubOrders. Supports filtering by `status`,
 *       `shopId`, and `centerId`. When `centerId` is provided, results include
 *       SubOrders where that center is the small center, origin hub, or dest hub.
 *     tags:
 *       - Admin
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
 *         description: Filter by SubOrder status.
 *       - in: query
 *         name: shopId
 *         schema:
 *           type: integer
 *           format: int64
 *         description: Filter by shop ID.
 *         example: 5
 *       - in: query
 *         name: centerId
 *         schema:
 *           type: integer
 *           format: int64
 *         description: Filter by center involvement (small, origin hub, or dest hub).
 *         example: 3
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
 *         description: Number of results per page.
 *     responses:
 *       200:
 *         description: Paginated list of SubOrders.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SubOrder'
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
 *       403:
 *         description: Authenticated user is not an admin.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "FORBIDDEN"
 *               message: "Admin access required"
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
router.get('/suborders', adminController.listSubOrders);

module.exports = router;
