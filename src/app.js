const express = require('express');
const helmet  = require('helmet');
const morgan  = require('morgan');
const swaggerUi   = require('swagger-ui-express');
const swaggerSpec = require('../config/swagger');
const { sequelize } = require('../config/database');
const authenticate  = require('../middlewares/authMiddleware');

require('dotenv').config({ path: './.env' });

require('../models/Index');

const app = express();

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Internal routes — X-Internal-Secret only, no Bearer token
app.use('/api/internal', require('../routes/internalRoutes'));

// All routes below require a valid SSO token
app.use(authenticate);

app.use('/api/checkout',  require('../routes/checkoutRoutes'));
app.use('/api/orders',    require('../routes/orderRoutes'));
app.use('/api/addresses', require('../routes/addressRoutes'));
app.use('/api/center',    require('../routes/centerRoutes'));
app.use('/api/hub',       require('../routes/hubRoutes'));
app.use('/api/admin',     require('../routes/adminRoutes'));

app.get('/', (req, res) => res.status(200).json({ message: 'Orders service is running' }));

const PORT = process.env.PORT || 3004;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Database synced.');

    app.listen(PORT, () => {
      console.log(`Orders service running on port ${PORT}`);
      console.log(`API docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start orders service:', error);
    process.exit(1);
  }
};

startServer();
