const { OFFLINE_POLLING_INTERVAL_MS, RESTART_DELAY_MS, RESTART_DELAY_SECONDS } = require('../config');
const { debugLog } = require('../utils/logger');
const { checkCoffeeMachineStatus: checkCoffeeMachineApi } = require('../services/coffeeApiService');
const { sendNotification } = require('../services/notificationService');
const { 
  resetMonitoringState, 
  handleMachineOnline, 
  handleMachineOffline, 
  restartPolling,
  setNotificationSent,
  setUptimeNotificationSent,
  getUptimeStartTime,
  clearCurrentInterval,
  getMachineOnlineStatus,
  getCurrentIntervalId,
  getUptimeNotificationSent,
  getNotificationSent
} = require('./stateManager');
const { 
  checkUptimeLimit, 
  isTargetTemperatureReached 
} = require('./temperatureMonitor');

let pollCallback = null;

/**
 * Set the poll callback function
 */
function setPollCallback(callback) {
  pollCallback = callback;
}

/**
 * Check coffee machine status and handle state changes
 */
async function checkCoffeeMachineStatus() {
  try {
    const result = await checkCoffeeMachineApi();
    
    if (result.success) {
      const data = result.data;
      
      if (Array.isArray(data) && data.length > 0) {
        const { temperature, targetTemperature, upTime } = data[0];
        const currentTemp = parseFloat(temperature);
        const targetTemp = parseFloat(targetTemperature);
        const uptimeSeconds = parseInt(upTime);
        const uptimeMinutes = Math.round(uptimeSeconds / 60);

        // Handle machine coming online
        if (!getMachineOnlineStatus()) {
          handleMachineOnline(poll);
        }

        // Check uptime limit
        if (checkUptimeLimit(uptimeMinutes, getUptimeNotificationSent())) {
          await sendNotification(`⚠️ Your coffee machine has been running for ${uptimeMinutes} minutes. Consider turning it off to save energy.`);
          setUptimeNotificationSent(true);
        }

        debugLog(
          `Current Temp: ${currentTemp}°C, Target Temp: ${targetTemp}°C, Uptime: ${uptimeMinutes} minutes (${uptimeSeconds} seconds)`
        );

        // Check if target temperature is reached
        const tempCheck = isTargetTemperatureReached(currentTemp, targetTemp, uptimeSeconds, getNotificationSent());
        
        if (tempCheck.startupDelayRemaining > 0) {
          debugLog(`Startup delay active: ${tempCheck.startupDelayRemaining} seconds remaining before temperature monitoring begins`);
        } else if (tempCheck.reached && !getNotificationSent()) {
          console.log(`Coffee machine is within target temperature range!`);
          await sendNotification("Hey! Your machine is at the target temp.");
          setNotificationSent(true);
        }

        // Continue monitoring until both conditions are met:
        // 1. Temperature notification sent OR temperature not yet reached
        // 2. Uptime notification sent OR uptime limit not yet exceeded
        // Temperature and uptime monitoring are completely independent
        
        const isTemperatureMonitoringComplete = getNotificationSent();
        const isUptimeMonitoringComplete = getUptimeNotificationSent();
        
        // Only stop polling if both monitoring tasks are complete
        if (isTemperatureMonitoringComplete && isUptimeMonitoringComplete) {
          console.log("Both temperature and uptime notifications sent. Stopping polling.");
          return true;
        }
        
        // If uptime notification is sent but temp not reached, continue monitoring temp
        if (isUptimeMonitoringComplete && !isTemperatureMonitoringComplete) {
          debugLog("Uptime notification sent, but continuing to monitor temperature.");
        }
        
        // If temp notification is sent but uptime not exceeded, continue monitoring uptime  
        if (isTemperatureMonitoringComplete && !isUptimeMonitoringComplete) {
          debugLog("Temperature notification sent, but continuing to monitor uptime.");
        }
      }
      return false;
    } else {
      // Handle API errors
      const error = result.error;
      const offlineErrorCodes = ["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "ECONNRESET", "EHOSTUNREACH", "EHOSTDOWN"];
      
      // Check for timeout errors (axios timeout doesn't have error.code)
      if (offlineErrorCodes.includes(error.code) || error.message.includes('timeout')) {
        // Machine is offline or unreachable
        if (getMachineOnlineStatus()) {
          handleMachineOffline(poll);
        } else {
          if (getCurrentIntervalId()) {
            restartPolling(OFFLINE_POLLING_INTERVAL_MS, poll);
          }
          debugLog(
            `Coffee machine API is currently offline. Retrying...`
          );
        }
      } else {
        console.error("Error fetching coffee machine status:", error.message);
      }
      return false;
    }
  } catch (error) {
    console.error("Unexpected error in checkCoffeeMachineStatus:", error);
    return false;
  }
}

/**
 * Main polling function
 */
async function poll() {
  const shouldStopPolling = await checkCoffeeMachineStatus();
  if (shouldStopPolling) {
    clearCurrentInterval();
    
    console.log(`Monitoring complete. Starting ${RESTART_DELAY_SECONDS} second timer before restarting...`);
    
    setTimeout(() => {
      console.log(`${RESTART_DELAY_SECONDS} seconds have passed. Restarting monitoring...`);
      resetMonitoringState();
      if (pollCallback) {
        pollCallback();
      }
    }, RESTART_DELAY_MS);
  }
}

/**
 * Start the monitoring process
 */
async function startMonitoring() {
  console.log(`Starting coffee machine monitoring...`);
  debugLog(`Initial polling interval: ${OFFLINE_POLLING_INTERVAL_MS / 1000} seconds (machine assumed offline)`);

  // Reset state to ensure clean start
  resetMonitoringState();
  
  // Start with offline polling interval first
  restartPolling(OFFLINE_POLLING_INTERVAL_MS, poll);
  
  // Then do initial check
  await poll();
}

module.exports = {
  checkCoffeeMachineStatus,
  poll,
  startMonitoring,
  setPollCallback
};
