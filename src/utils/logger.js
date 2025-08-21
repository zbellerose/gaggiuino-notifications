const { DEBUG_ENABLED } = require('../config');

/**
 * Debug logging function - only logs when DEBUG_ENABLED is true
 */
function debugLog(message, ...args) {
  if (DEBUG_ENABLED) {
    console.log(`[DEBUG] ${message}`, ...args);
  }
}

module.exports = {
  debugLog
};
