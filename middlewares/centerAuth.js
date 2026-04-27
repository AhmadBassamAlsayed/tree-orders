const { CenterAssignment, Center } = require('../models/Index');

/**
 * Middleware factory. Verifies the caller has a CenterAssignment with one of
 * the given roles and (optionally) at a center of the given type.
 * Sets req.center and req.centerRole on success.
 */
const requireCenterRole = (centerType, ...roles) => async (req, res, next) => {
  try {
    const assignment = await CenterAssignment.findOne({
      where: { userId: req.userId },
      include: [{ model: Center, as: 'center' }]
    });

    if (!assignment) {
      return res.status(403).json({ error: 'UNAUTHORIZED_CENTER', message: 'No center assignment found' });
    }

    if (!roles.includes(assignment.role)) {
      return res.status(403).json({ error: 'UNAUTHORIZED_CENTER', message: 'Insufficient center role' });
    }

    if (centerType && assignment.center.type !== centerType) {
      return res.status(403).json({ error: 'UNAUTHORIZED_CENTER', message: `Requires a ${centerType} center assignment` });
    }

    req.center     = assignment.center;
    req.centerRole = assignment.role;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Admin access required' });
  }
  next();
};

module.exports = { requireCenterRole, requireAdmin };
