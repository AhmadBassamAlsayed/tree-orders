const swaggerJsdoc = require('swagger-jsdoc');

const PORT = process.env.PORT || 3005;
const HOST = process.env.SWAGGER_HOST || 'localhost';
const PROTOCOL = process.env.SWAGGER_PROTOCOL || 'http';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Orders Service API',
      version: '1.0.0',
      description: 'Orders & logistics service for the Tree platform.'
    },
    servers: [{ url: `${PROTOCOL}://${HOST}:${PORT}`, description: 'Tree Orders service' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        internalSecret: { type: 'apiKey', in: 'header', name: 'X-Internal-Secret' }
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            error: { type: 'string', nullable: true }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js']
};

module.exports = swaggerJsdoc(options);
