const internalAuth = (req, res, next) => {
  const secret = req.headers['x-internal-secret'];
  if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid internal secret' });
  }
  next();
};

module.exports = internalAuth;
