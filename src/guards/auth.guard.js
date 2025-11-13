const { logger } = require('../utils');

/**
 * Guard that ensures requests present the expected API key header.
 * Call it before the controller handler: router.use(authGuard('expected-key'));
 */
const authGuard = (expectedKey) => (req, res, next) => {
  const providedKey = req.headers['x-api-key'];

  if (!expectedKey) {
    logger.warn('Auth guard misconfigured: expected key is missing');
    return next();
  }

  if (providedKey !== expectedKey) {
    logger.warn('Unauthorized request blocked');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  return next();
};

module.exports = {
  authGuard,
};
