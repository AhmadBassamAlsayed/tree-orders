const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');

/**
 * @swagger
 * components:
 *   schemas:
 *     City:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 1
 *         name:
 *           type: string
 *           example: "Damascus"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-01-15T10:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-01-15T10:00:00.000Z"
 *
 *     Center:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 3
 *         type:
 *           type: string
 *           enum: [small, main]
 *           example: "main"
 *         name:
 *           type: string
 *           example: "Damascus Main Hub"
 *         cityId:
 *           type: integer
 *           format: int64
 *           example: 1
 *         address:
 *           type: string
 *           example: "Al-Mazzeh, Damascus"
 *         parentHubId:
 *           type: integer
 *           format: int64
 *           nullable: true
 *           example: null
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CenterAssignment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 10
 *         userId:
 *           type: integer
 *           format: int64
 *           example: 42
 *         centerId:
 *           type: integer
 *           format: int64
 *           example: 3
 *         role:
 *           type: string
 *           enum: [worker, manager]
 *           example: "worker"
 *         assignedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-06-01T08:00:00.000Z"
 *
 *     DeliveryAddress:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 7
 *         customerId:
 *           type: integer
 *           format: int64
 *           example: 101
 *         cityId:
 *           type: integer
 *           format: int64
 *           example: 1
 *         street:
 *           type: string
 *           example: "Omar Al-Mukhtar Street"
 *         building:
 *           type: string
 *           nullable: true
 *           example: "Building 4"
 *         floor:
 *           type: string
 *           nullable: true
 *           example: "3"
 *         apartment:
 *           type: string
 *           nullable: true
 *           example: "12B"
 *         label:
 *           type: string
 *           nullable: true
 *           example: "Home"
 *         isDefault:
 *           type: integer
 *           enum: [0, 1]
 *           example: 1
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     SubOrderItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 55
 *         subOrderId:
 *           type: integer
 *           format: int64
 *           example: 20
 *         productId:
 *           type: integer
 *           format: int64
 *           example: 301
 *         variantId:
 *           type: integer
 *           format: int64
 *           nullable: true
 *           example: null
 *         quantity:
 *           type: integer
 *           example: 2
 *         unitPrice:
 *           type: number
 *           format: double
 *           example: 4500.0000
 *
 *     SubOrder:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 20
 *         orderId:
 *           type: integer
 *           format: int64
 *           example: 8
 *         shopId:
 *           type: integer
 *           format: int64
 *           example: 5
 *         shopCityId:
 *           type: integer
 *           format: int64
 *           example: 2
 *         holdId:
 *           type: integer
 *           format: int64
 *           example: 99
 *         smallCenterId:
 *           type: integer
 *           format: int64
 *           nullable: true
 *           example: null
 *         originHubId:
 *           type: integer
 *           format: int64
 *           example: 4
 *         destHubId:
 *           type: integer
 *           format: int64
 *           example: 3
 *         status:
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
 *           example: "pending"
 *         totalAmount:
 *           type: number
 *           format: double
 *           example: 9000.0000
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SubOrderItem'
 *
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 8
 *         customerId:
 *           type: integer
 *           format: int64
 *           example: 101
 *         cartId:
 *           type: integer
 *           format: int64
 *           example: 15
 *         deliveryAddressId:
 *           type: integer
 *           format: int64
 *           example: 7
 *         destinationCityId:
 *           type: integer
 *           format: int64
 *           example: 1
 *         destHubId:
 *           type: integer
 *           format: int64
 *           example: 3
 *         status:
 *           type: string
 *           enum: [pending, processing, in_transit, delivered, cancelled]
 *           example: "pending"
 *         totalAmount:
 *           type: number
 *           format: double
 *           example: 9000.0000
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         subOrders:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SubOrder'
 *
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 20
 *         total:
 *           type: integer
 *           example: 100
 */

/**
 * @swagger
 * /api/checkout:
 *   post:
 *     summary: Place an order (checkout)
 *     description: |
 *       Converts an open cart or a single shop subcart into an Order. This
 *       endpoint performs the following steps atomically:
 *       1. Validates the cart/subcart ownership.
 *       2. Fetches live product prices and validates stock.
 *       3. Resolves delivery address and destination hub.
 *       4. Resolves origin hubs for each subcart's shop city.
 *       5. Verifies the customer has sufficient SYP wallet balance.
 *       6. Creates payment holds in tree-financial (one per subcart).
 *       7. Persists the Order, SubOrders, SubOrderItems, and initial status logs.
 *       8. Marks each subcart as checked-out in tree-shops.
 *
 *       Supply **either** `cartId` **or** `shopId` — not both.
 *     tags:
 *       - Checkout
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cartId:
 *                 type: integer
 *                 format: int64
 *                 description: ID of the full cart to check out. Mutually exclusive with shopId.
 *                 example: 15
 *               shopId:
 *                 type: integer
 *                 format: int64
 *                 description: ID of a single shop whose open subcart will be checked out. Mutually exclusive with cartId.
 *                 example: 5
 *               addressId:
 *                 type: integer
 *                 format: int64
 *                 description: ID of the customer's saved delivery address.
 *                 example: 7
 *             required:
 *               - addressId
 *           examples:
 *             byCart:
 *               summary: Checkout a full cart
 *               value:
 *                 cartId: 15
 *                 addressId: 7
 *             byShop:
 *               summary: Checkout a single shop's subcart
 *               value:
 *                 shopId: 5
 *                 addressId: 7
 *     responses:
 *       201:
 *         description: Order created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       format: int64
 *                       example: 8
 *                     status:
 *                       type: string
 *                       example: "pending"
 *                     totalAmount:
 *                       type: number
 *                       format: double
 *                       example: 9000.0000
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     deliveryAddress:
 *                       type: object
 *                       properties:
 *                         street:
 *                           type: string
 *                           example: "Omar Al-Mukhtar Street"
 *                         cityId:
 *                           type: integer
 *                           example: 1
 *                     subOrders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             format: int64
 *                             example: 20
 *                           shopId:
 *                             type: integer
 *                             format: int64
 *                             example: 5
 *                           status:
 *                             type: string
 *                             example: "pending"
 *                           totalAmount:
 *                             type: number
 *                             format: double
 *                             example: 9000.0000
 *                           items:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 productId:
 *                                   type: integer
 *                                   format: int64
 *                                   example: 301
 *                                 variantId:
 *                                   type: integer
 *                                   format: int64
 *                                   nullable: true
 *                                   example: null
 *                                 quantity:
 *                                   type: integer
 *                                   example: 2
 *                                 unitPrice:
 *                                   type: number
 *                                   format: double
 *                                   example: 4500.0000
 *       400:
 *         description: |
 *           Bad request. Possible error codes:
 *           - `MISSING_CHECKOUT_TARGET` — neither cartId nor shopId provided, or both provided.
 *           - `CART_EMPTY` — cart has no open subcarts.
 *           - `INSUFFICIENT_BALANCE` — customer has no SYP wallet or balance is below order total.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingTarget:
 *                 value:
 *                   error: "MISSING_CHECKOUT_TARGET"
 *                   message: "Provide either cartId or shopId, not both"
 *               cartEmpty:
 *                 value:
 *                   error: "CART_EMPTY"
 *                   message: "No items to check out"
 *               insufficientBalance:
 *                 value:
 *                   error: "INSUFFICIENT_BALANCE"
 *                   message: "Available balance is less than order total"
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
 *           Access denied. Possible error codes:
 *           - `FORBIDDEN` — cart or subcart does not belong to the authenticated customer.
 *           - Account deleted or banned (from auth middleware).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "FORBIDDEN"
 *       404:
 *         description: |
 *           Resource not found. Possible error codes:
 *           - `SUBCART_NOT_FOUND` — no open subcart exists for the given shopId.
 *           - `CART_NOT_FOUND` — cart with given cartId does not exist.
 *           - `ADDRESS_NOT_FOUND` — no delivery address found for the given addressId.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               subcartNotFound:
 *                 value:
 *                   error: "SUBCART_NOT_FOUND"
 *                   message: "No open subcart found for this shop"
 *               cartNotFound:
 *                 value:
 *                   error: "CART_NOT_FOUND"
 *               addressNotFound:
 *                 value:
 *                   error: "ADDRESS_NOT_FOUND"
 *       409:
 *         description: Cart has already been checked out (`CART_NOT_OPEN`).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "CART_NOT_OPEN"
 *               message: "Cart is already checked out"
 *       422:
 *         description: |
 *           Business rule violation. Possible error codes:
 *           - `PRODUCT_OUT_OF_STOCK` — a product is inactive or has insufficient stock.
 *           - `NO_DELIVERY_COVERAGE` — no main center exists for the destination city.
 *           - `NO_HUB_FOR_SHOP_CITY` — a shop's city has no main hub center.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               outOfStock:
 *                 value:
 *                   error: "PRODUCT_OUT_OF_STOCK"
 *                   message: "Insufficient stock for product 301"
 *                   productId: 301
 *               noDeliveryCoverage:
 *                 value:
 *                   error: "NO_DELIVERY_COVERAGE"
 *                   message: "No main center for destination city"
 *       500:
 *         description: |
 *           Server-side failure. Possible error codes:
 *           - `CHECKOUT_HOLD_FAILED` — payment hold creation failed; any created holds were released.
 *           - `INTERNAL_ERROR` — unexpected server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               holdFailed:
 *                 value:
 *                   error: "CHECKOUT_HOLD_FAILED"
 *                   message: "Payment reservation failed; no charge made"
 *               internalError:
 *                 value:
 *                   error: "INTERNAL_ERROR"
 *                   message: "Unexpected database error"
 *       502:
 *         description: An upstream service (tree-shops or tree-financial) returned an error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               shopsError:
 *                 value:
 *                   error: "SHOPS_SERVICE_ERROR"
 *               financialError:
 *                 value:
 *                   error: "FINANCIAL_SERVICE_ERROR"
 *       503:
 *         description: The SSO authentication service is unreachable.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Authentication service unavailable"
 */
router.post('/', checkoutController.checkout);

module.exports = router;
