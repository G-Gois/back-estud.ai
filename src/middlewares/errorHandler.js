const { logger } = require('../utils');


const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', err);

  const status = err.status || 500;
  const payload = {
    message: err.message || 'Internal server error',
  };

  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
};

module.exports = errorHandler;
