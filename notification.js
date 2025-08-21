// Load environment variables
require('dotenv').config();

const axios = require("axios");
const twilio = require("twilio");

// --- Configuration from environment variables ---
const COFFEE_MACHINE_API_URL = process.env.COFFEE_MACHINE_API_URL || "http://gaggiuino.local/api/system/status";

// Twilio Configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const YOUR_PHONE_NUMBER = process.env.YOUR_PHONE_NUMBER;

// Discord Webhook Configuration
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const DISCORD_USER_ID = process.env.DISCORD_USER_ID;

// Notification Settings
const DISCORD_ENABLED = process.env.DISCORD_ENABLED === 'true';
const TWILIO_ENABLED = process.env.TWILIO_ENABLED === 'true';

// Debug Settings
const DEBUG_ENABLED = process.env.DEBUG === 'true';

// Temperature Settings
const TEMPERATURE_VARIANCE = parseFloat(process.env.TEMPERATURE_VARIANCE) || 0.5;

// Polling Intervals
const ONLINE_POLLING_INTERVAL_MS = parseInt(process.env.ONLINE_POLLING_INTERVAL_MS) || 5 * 1000;
const OFFLINE_POLLING_INTERVAL_MS = parseInt(process.env.OFFLINE_POLLING_INTERVAL_MS) || 30 * 1000;

// Restart delay after notification (30 minutes default)
const RESTART_DELAY_MS = parseInt(process.env.RESTART_DELAY_MS) || 30 * 60 * 1000;

// Startup delay before temperature monitoring (2 minutes default)
const STARTUP_DELAY_MS = parseInt(process.env.STARTUP_DELAY_MS) || 2 * 60 * 1000;

// Uptime monitoring (45 minutes default)
const MAX_UPTIME_MS = parseInt(process.env.MAX_UPTIME_MS) || 45 * 60 * 1000;

// Uptime monitoring toggle
const UPTIME_EXCEEDED_ENABLED = process.env.UPTIME_EXCEEDED_ENABLED === 'true';

// Constants
const MAX_UPTIME_MINUTES = MAX_UPTIME_MS / 60000;
const RESTART_DELAY_SECONDS = RESTART_DELAY_MS / 1000;
const STARTUP_DELAY_SECONDS = STARTUP_DELAY_MS / 1000;

const client = new twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// State management
let notificationSent = false; // Flag to ensure notification is sent only once
let isMachineOnline = false; // Track machine online/offline status
let currentIntervalId = null; // Track current interval
let uptimeStartTime = null; // Track when machine came online
let uptimeNotificationSent = false; // Flag to ensure uptime notification is sent only once

/**
 * Debug logging function - only logs when DEBUG_ENABLED is true
 */
function debugLog(message, ...args) {
  if (DEBUG_ENABLED) {
    console.log(`[DEBUG] ${message}`, ...args);
  }
}

/**
 * Send Discord notification via webhook
 */
async function sendDiscordNotification(message) {
  if (!DISCORD_ENABLED || !DISCORD_WEBHOOK_URL) {
    debugLog("Discord notifications disabled or webhook URL not configured");
    return;
  }

  try {
    const payload = {
      content: `☕ **Coffee Machine Alert** ☕\n<@${DISCORD_USER_ID}> ${message}`,
      username: "Coffee Machine Bot",
      avatar_url: "https://cdn-icons-png.flaticon.com/512/3137/3137064.png"
    };

    await axios.post(DISCORD_WEBHOOK_URL, payload);
    console.log(`Discord notification sent: "${message}"`);
  } catch (error) {
    console.error("Failed to send Discord notification:", error.message);
    if (error.response) {
      debugLog("Discord API Error:", error.response.data);
    }
  }
}

/**
 * Send SMS notification via Twilio
 */
async function sendSmsNotification(message) {
  if (!TWILIO_ENABLED) {
    debugLog("Twilio SMS notifications disabled");
    return;
  }

  try {
    await client.messages.create({
      body: message,
      to: YOUR_PHONE_NUMBER,
      from: TWILIO_PHONE_NUMBER,
    });
    console.log(`SMS sent: "${message}" to ${YOUR_PHONE_NUMBER}`);
  } catch (error) {
    console.error("Failed to send SMS:", error.message);
    if (error.response) {
      debugLog("Twilio API Error:", error.response.data);
    }
  }
}

/**
 * Send both Discord and SMS notifications
 */
async function sendNotification(message) {
  await Promise.all([
    sendDiscordNotification(message),
    sendSmsNotification(message)
  ]);
}

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
function handleMachineOnline() {
  console.log("Coffee machine is now online!");
  isMachineOnline = true;
  uptimeStartTime = Date.now();
  uptimeNotificationSent = false;
  restartPolling(ONLINE_POLLING_INTERVAL_MS);
  debugLog(`Switched to online polling interval: ${ONLINE_POLLING_INTERVAL_MS / 1000} seconds`);
}

/**
 * Handle machine going offline
 */
function handleMachineOffline() {
  console.log("Coffee machine went offline. Switching to slower polling...");
  isMachineOnline = false;
  uptimeStartTime = null;
  uptimeNotificationSent = false;
  restartPolling(OFFLINE_POLLING_INTERVAL_MS);
  debugLog(`Switched to offline polling interval: ${OFFLINE_POLLING_INTERVAL_MS / 1000} seconds`);
}

/**
 * Check if uptime limit has been exceeded
 */
function checkUptimeLimit(uptimeMinutes) {
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
 * Check coffee machine status and handle state changes
 */
async function checkCoffeeMachineStatus() {
  try {
    const response = await axios.get(COFFEE_MACHINE_API_URL, {
      timeout: 10000 // 10 second timeout
    });
    const data = response.data;

    if (Array.isArray(data) && data.length > 0) {
      const { temperature, targetTemperature, upTime } = data[0];
      const currentTemp = parseFloat(temperature);
      const targetTemp = parseFloat(targetTemperature);
      const uptimeSeconds = parseInt(upTime);
      const uptimeMinutes = Math.round(uptimeSeconds / 60);

      // Handle machine coming online
      if (!isMachineOnline) {
        handleMachineOnline();
      }

      // Check uptime limit
      if (checkUptimeLimit(uptimeMinutes)) {
        await sendNotification(`⚠️ Your coffee machine has been running for ${uptimeMinutes} minutes. Consider turning it off to save energy.`);
        uptimeNotificationSent = true;
      }

      debugLog(
        `Current Temp: ${currentTemp}°C, Target Temp: ${targetTemp}°C (Variance: ±${TEMPERATURE_VARIANCE}°C), Uptime: ${uptimeMinutes} minutes (${uptimeSeconds} seconds)`
      );

      // Check if target temperature is reached (only after startup delay)
      const uptimeMs = uptimeSeconds * 1000;
      if (uptimeMs < STARTUP_DELAY_MS) {
        debugLog(`Startup delay active: ${Math.ceil((STARTUP_DELAY_MS - uptimeMs) / 1000)} seconds remaining before temperature monitoring begins`);
      } else if (isTemperatureInRange(currentTemp, targetTemp) && !notificationSent) {
        console.log(`Coffee machine is within target temperature range!`);
        await sendNotification("Hey! Your machine is at the target temp.");
        notificationSent = true;
        console.log("Stopping polling as target temperature is reached.");
        return true;
      }
    }
    return false;
  } catch (error) {
    const offlineErrorCodes = ["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "ECONNRESET", "EHOSTUNREACH"];
    
    // Check for timeout errors (axios timeout doesn't have error.code)
    if (offlineErrorCodes.includes(error.code) || error.message.includes('timeout')) {
      // Machine is offline or unreachable
      if (isMachineOnline) {
        handleMachineOffline();
      } else {
        if (currentIntervalId) {
          restartPolling(OFFLINE_POLLING_INTERVAL_MS);
        }
        debugLog(
          `Coffee machine API at ${COFFEE_MACHINE_API_URL} is currently offline. Retrying...`
        );
      }
    } else {
      console.error("Error fetching coffee machine status:", error.message);
    }
    return false;
  }
}

/**
 * Restart polling with new interval
 */
function restartPolling(newInterval) {
  if (currentIntervalId) {
    clearInterval(currentIntervalId);
  }
  currentIntervalId = setInterval(poll, newInterval);
  debugLog(`Polling interval changed to ${newInterval / 1000} seconds`);
}

/**
 * Main polling function
 */
async function poll() {
  const targetReached = await checkCoffeeMachineStatus();
  if (targetReached) {
    if (currentIntervalId) {
      clearInterval(currentIntervalId);
      currentIntervalId = null;
    }
    
    console.log(`Target temperature reached! Starting ${RESTART_DELAY_SECONDS} second timer...`);
    
    setTimeout(() => {
      console.log(`${RESTART_DELAY_SECONDS} seconds have passed. Restarting monitoring...`);
      resetMonitoringState();
      startMonitoring();
    }, RESTART_DELAY_MS);
  }
}

/**
 * Start the monitoring process
 */
async function startMonitoring() {
  console.log(`Starting coffee machine monitoring for ${COFFEE_MACHINE_API_URL}...`);
  debugLog(`Initial polling interval: ${OFFLINE_POLLING_INTERVAL_MS / 1000} seconds (machine assumed offline)`);

  // Reset state to ensure clean start
  resetMonitoringState();
  
  // Start with offline polling interval first
  currentIntervalId = setInterval(poll, OFFLINE_POLLING_INTERVAL_MS);
  
  // Then do initial check
  await poll();
}

// Start the monitoring process (only if not in test environment)
if (process.env.NODE_ENV !== 'test') {
  startMonitoring();
}

// Export functions for testing
module.exports = {
  sendDiscordNotification,
  sendSmsNotification,
  sendNotification,
  checkCoffeeMachineStatus,
  resetMonitoringState,
  startMonitoring,
  TEMPERATURE_VARIANCE,
  DISCORD_ENABLED,
  TWILIO_ENABLED,
  DISCORD_WEBHOOK_URL,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  YOUR_PHONE_NUMBER,
  MAX_UPTIME_MS,
  UPTIME_EXCEEDED_ENABLED,
  DEBUG_ENABLED,
  STARTUP_DELAY_MS
};