/**
 * Basic utility helpers used across the project.
 */
const formatResponse = (data, message = 'OK') => ({
  timestamp: new Date().toISOString(),
  message,
  data,
});

const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
};

module.exports = {
  formatResponse,
  logger,
};
