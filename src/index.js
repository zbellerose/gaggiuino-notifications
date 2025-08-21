const { startMonitoring, setPollCallback } = require('./monitoring/coffeeMonitor');

// Set up the poll callback to restart monitoring
setPollCallback(() => startMonitoring());

// Start the monitoring process (only if not in test environment)
if (process.env.NODE_ENV !== 'test') {
  startMonitoring();
}

// Export functions for testing
module.exports = {
  startMonitoring,
  setPollCallback
};
