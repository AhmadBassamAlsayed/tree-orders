const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');

/**
 * @swagger
 * /api/addresses:
 *   post:
 *     summary: Create a delivery address
 *     description: |
 *       Saves a new delivery address for the authenticated customer. The `cityId`
 *       must reference an existing city. If `isDefault` is `true`, all other
 *       addresses for this customer are automatically set to non-default.
 *     tags:
 *       - Addresses
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cityId
 *               - street
 *             properties:
 *               cityId:
 *                 type: integer
 *                 format: int64
 *                 description: ID of the city where the address is located.
 *                 example: 1
 *               street:
 *                 type: string
 *                 maxLength: 255
 *                 description: Street name and number.
 *                 example: "Omar Al-Mukhtar Street"
 *               building:
 *                 type: string
 *                 maxLength: 100
 *                 nullable: true
 *                 description: Building name or number.
 *                 example: "Building 4"
 *               floor:
 *                 type: string
 *                 maxLength: 20
 *                 nullable: true
 *                 description: Floor number or label.
 *                 example: "3"
 *               apartment:
 *                 type: string
 *                 maxLength: 20
 *                 nullable: true
 *                 description: Apartment number or label.
 *                 example: "12B"
 *               label:
 *                 type: string
 *                 maxLength: 50
 *                 nullable: true
 *                 description: Friendly label for the address (e.g. "Home", "Office").
 *                 example: "Home"
 *               isDefault:
 *                 type: boolean
 *                 description: Whether this address should become the customer's default.
 *                 example: true
 *           example:
 *             cityId: 1
 *             street: "Omar Al-Mukhtar Street"
 *             building: "Building 4"
 *             floor: "3"
 *             apartment: "12B"
 *             label: "Home"
 *             isDefault: true
 *     responses:
 *       201:
 *         description: Address created. Returns the full address record.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryAddress'
 *       401:
 *         description: Missing or invalid Bearer token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Access token is required"
 *       404:
 *         description: The provided cityId does not match any city.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "CITY_NOT_FOUND"
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
router.post('/',    addressController.createAddress);

/**
 * @swagger
 * /api/addresses:
 *   get:
 *     summary: List the authenticated customer's delivery addresses
 *     description: |
 *       Returns all delivery addresses saved by the authenticated customer.
 *       The default address is listed first, then by newest-first.
 *     tags:
 *       - Addresses
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of delivery addresses.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DeliveryAddress'
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
router.get('/',     addressController.listAddresses);

/**
 * @swagger
 * /api/addresses/{id}:
 *   patch:
 *     summary: Update a delivery address
 *     description: |
 *       Updates fields on an existing delivery address owned by the authenticated
 *       customer. All body fields are optional — only those provided are updated.
 *       If `isDefault` is set to `true`, all other addresses for this customer
 *       are automatically set to non-default.
 *     tags:
 *       - Addresses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         description: Address ID to update.
 *         example: 7
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cityId:
 *                 type: integer
 *                 format: int64
 *                 example: 1
 *               street:
 *                 type: string
 *                 maxLength: 255
 *                 example: "Yarmouk Street"
 *               building:
 *                 type: string
 *                 maxLength: 100
 *                 nullable: true
 *                 example: "Building 7"
 *               floor:
 *                 type: string
 *                 maxLength: 20
 *                 nullable: true
 *                 example: "1"
 *               apartment:
 *                 type: string
 *                 maxLength: 20
 *                 nullable: true
 *                 example: "5A"
 *               label:
 *                 type: string
 *                 maxLength: 50
 *                 nullable: true
 *                 example: "Office"
 *               isDefault:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Address updated. Returns the updated address record.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryAddress'
 *       401:
 *         description: Missing or invalid Bearer token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Access token is required"
 *       404:
 *         description: Address not found or does not belong to this customer.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "ADDRESS_NOT_FOUND"
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
router.patch('/:id', addressController.updateAddress);

/**
 * @swagger
 * /api/addresses/{id}:
 *   delete:
 *     summary: Delete a delivery address
 *     description: |
 *       Permanently deletes a delivery address owned by the authenticated customer.
 *       The deletion is blocked if the address is currently referenced by an active
 *       order (any status other than `delivered` or `cancelled`).
 *     tags:
 *       - Addresses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         description: Address ID to delete.
 *         example: 7
 *     responses:
 *       200:
 *         description: Address deleted successfully.
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
 *       404:
 *         description: Address not found or does not belong to this customer.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "ADDRESS_NOT_FOUND"
 *       409:
 *         description: Address is referenced by an active order and cannot be deleted.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "ADDRESS_IN_USE"
 *               message: "Address is referenced by an active order"
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
router.delete('/:id', addressController.deleteAddress);

module.exports = router;
