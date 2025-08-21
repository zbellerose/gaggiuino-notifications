const { TEMPERATURE_VARIANCE, STARTUP_DELAY_MS, MAX_UPTIME_MINUTES, UPTIME_EXCEEDED_ENABLED } = require('../config');

/**
 * Check if uptime limit has been exceeded
 */
function checkUptimeLimit(uptimeMinutes, uptimeNotificationSent) {
  if (!UPTIME_EXCEEDED_ENABLED || uptimeNotificationSent) {
    return false;
  }
  
  if (uptimeMinutes > MAX_UPTIME_MINUTES) {
    console.log(`⚠️ Machine has been running for ${uptimeMinutes} minutes (max: ${MAX_UPTIME_MINUTES} minutes)`);
    return true;
  }
  
  return false;
}

/**
 * Check if temperature is within target range
 */
function isTemperatureInRange(currentTemp, targetTemp) {
  const lowerBound = targetTemp - TEMPERATURE_VARIANCE;
  const upperBound = targetTemp + TEMPERATURE_VARIANCE;
  return currentTemp >= lowerBound && currentTemp <= upperBound;
}

/**
 * Check if target temperature is reached (only after startup delay)
 */
function isTargetTemperatureReached(currentTemp, targetTemp, uptimeSeconds, notificationSent) {
  const uptimeMs = uptimeSeconds * 1000;
  
  if (uptimeMs < STARTUP_DELAY_MS) {
    return { reached: false, startupDelayRemaining: Math.ceil((STARTUP_DELAY_MS - uptimeMs) / 1000) };
  }
  
  if (isTemperatureInRange(currentTemp, targetTemp) && !notificationSent) {
    return { reached: true, startupDelayRemaining: 0 };
  }
  
  return { reached: false, startupDelayRemaining: 0 };
}

module.exports = {
  checkUptimeLimit,
  isTemperatureInRange,
  isTargetTemperatureReached
};
