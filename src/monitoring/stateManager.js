const { ONLINE_POLLING_INTERVAL_MS, OFFLINE_POLLING_INTERVAL_MS, RESTART_DELAY_MS } = require('../config');
const { debugLog } = require('../utils/logger');

// State management
let notificationSent = false; // Flag to ensure notification is sent only once
let isMachineOnline = false; // Track machine online/offline status
let currentIntervalId = null; // Track current interval
let uptimeStartTime = null; // Track when machine came online
let uptimeNotificationSent = false; // Flag to ensure uptime notification is sent only once

/**
 * Reset all monitoring state
 */
function resetMonitoringState() {
  notificationSent = false;
  isMachineOnline = false;
  uptimeStartTime = null;
  uptimeNotificationSent = false;
}

/**
 * Handle machine coming online
 */
function handleMachineOnline(pollFunction) {
  console.log("Coffee machine is now online!");
  isMachineOnline = true;
  uptimeStartTime = Date.now();
  uptimeNotificationSent = false;
  restartPolling(ONLINE_POLLING_INTERVAL_MS, pollFunction);
  debugLog(`Switched to online polling interval: ${ONLINE_POLLING_INTERVAL_MS / 1000} seconds`);
}

/**
 * Handle machine going offline
 */
function handleMachineOffline(pollFunction) {
  console.log("Coffee machine went offline. Switching to slower polling...");
  isMachineOnline = false;
  uptimeStartTime = null;
  uptimeNotificationSent = false;
  restartPolling(OFFLINE_POLLING_INTERVAL_MS, pollFunction);
  debugLog(`Switched to offline polling interval: ${OFFLINE_POLLING_INTERVAL_MS / 1000} seconds`);
}

/**
 * Restart polling with new interval
 */
function restartPolling(newInterval, pollFunction) {
  if (currentIntervalId) {
    clearInterval(currentIntervalId);
  }
  currentIntervalId = setInterval(pollFunction, newInterval);
  debugLog(`Polling interval changed to ${newInterval / 1000} seconds`);
}

/**
 * Get current state values
 */
function getState() {
  return {
    notificationSent,
    isMachineOnline,
    currentIntervalId,
    uptimeStartTime,
    uptimeNotificationSent
  };
}

/**
 * Set notification sent flag
 */
function setNotificationSent(value) {
  notificationSent = value;
}

/**
 * Set uptime notification sent flag
 */
function setUptimeNotificationSent(value) {
  uptimeNotificationSent = value;
}

/**
 * Get uptime start time
 */
function getUptimeStartTime() {
  return uptimeStartTime;
}

/**
 * Check if machine is online
 */
function getMachineOnlineStatus() {
  return isMachineOnline;
}

/**
 * Clear current interval
 */
function clearCurrentInterval() {
  if (currentIntervalId) {
    clearInterval(currentIntervalId);
    currentIntervalId = null;
  }
}

/**
 * Get current interval ID
 */
function getCurrentIntervalId() {
  return currentIntervalId;
}

/**
 * Get notification sent status
 */
function getNotificationSent() {
  return notificationSent;
}

/**
 * Get uptime notification sent status
 */
function getUptimeNotificationSent() {
  return uptimeNotificationSent;
}

module.exports = {
  resetMonitoringState,
  handleMachineOnline,
  handleMachineOffline,
  restartPolling,
  getState,
  setNotificationSent,
  setUptimeNotificationSent,
  getUptimeStartTime,
  getMachineOnlineStatus,
  clearCurrentInterval,
  getCurrentIntervalId,
  getNotificationSent,
  getUptimeNotificationSent
};
