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

// Temperature Settings
const TEMPERATURE_VARIANCE = parseFloat(process.env.TEMPERATURE_VARIANCE) || 0.5;

// Polling Intervals
const ONLINE_POLLING_INTERVAL_MS = parseInt(process.env.ONLINE_POLLING_INTERVAL_MS) || 5 * 1000;
const OFFLINE_POLLING_INTERVAL_MS = parseInt(process.env.OFFLINE_POLLING_INTERVAL_MS) || 30 * 1000;

const RESTART_DELAY_MS = parseInt(process.env.RESTART_DELAY_MS) || 30 * 60 * 1000;

const client = new twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

let notificationSent = false; // Flag to ensure notification is sent only once
let isMachineOnline = false; // Track machine online/offline status
let currentIntervalId = null; // Track current interval

async function sendDiscordNotification(message) {
  if (!DISCORD_ENABLED || !DISCORD_WEBHOOK_URL) {
    console.log("Discord notifications disabled or webhook URL not configured");
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
      console.error("Discord API Error:", error.response.data);
    }
  }
}

async function sendSmsNotification(message) {
  if (!TWILIO_ENABLED) {
    console.log("Twilio SMS notifications disabled");
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
      console.error("Twilio API Error:", error.response.data);
    }
  }
}

async function sendNotification(message) {
  // Send both Discord and SMS notifications
  await Promise.all([
    sendDiscordNotification(message),
    sendSmsNotification(message)
  ]);
}

async function checkCoffeeMachineStatus() {
  try {
    const response = await axios.get(COFFEE_MACHINE_API_URL);
    const data = response.data;

    if (Array.isArray(data) && data.length > 0) {
      const { temperature, targetTemperature } = data[0];
      const currentTemp = parseFloat(temperature);
      const targetTemp = parseFloat(targetTemperature);

      // Machine is online and responding
      if (!isMachineOnline) {
        console.log("Coffee machine is now online!");
        isMachineOnline = true;
        // Restart polling with faster interval
        restartPolling(ONLINE_POLLING_INTERVAL_MS);
      }

      console.log(
        `Current Temp: ${currentTemp}°C, Target Temp: ${targetTemp}°C (Variance: ±${TEMPERATURE_VARIANCE}°C)`
      );

      // Check if current temperature is within the variance range of target temperature
      const lowerBound = targetTemp - TEMPERATURE_VARIANCE;
      const upperBound = targetTemp + TEMPERATURE_VARIANCE;
      
      if (currentTemp >= lowerBound && currentTemp <= upperBound && !notificationSent) {
        console.log(`Coffee machine is within target temperature range (${lowerBound}°C - ${upperBound}°C)!`);
        await sendNotification("Hey! Your machine is at the target temp.");
        notificationSent = true; // Set flag to true after sending
        console.log("Stopping polling as target temperature is reached.");
        return true; // Indicate that target temp is reached
      }
    }
    return false; // Indicate that target temp is not yet reached
  } catch (error) {
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      // Machine is offline
      if (isMachineOnline) {
        console.log("Coffee machine went offline. Switching to slower polling...");
        isMachineOnline = false;
        // Restart polling with slower interval
        restartPolling(OFFLINE_POLLING_INTERVAL_MS);
      } else {
        console.log(
          `Coffee machine API at ${COFFEE_MACHINE_API_URL} is currently offline. Retrying...`
        );
      }
    } else {
      console.error(
        "Error fetching coffee machine status:",
        error.message
      );
    }
    return false;
  }
}

function restartPolling(newInterval) {
  if (currentIntervalId) {
    clearInterval(currentIntervalId);
  }
  currentIntervalId = setInterval(poll, newInterval);
  console.log(`Polling interval changed to ${newInterval / 1000} seconds`);
}

async function startMonitoring() {
  console.log(`Starting coffee machine monitoring for ${COFFEE_MACHINE_API_URL}...`);
  console.log(`Initial polling interval: ${OFFLINE_POLLING_INTERVAL_MS / 1000} seconds (machine assumed offline)`);

  const poll = async () => {
    const targetReached = await checkCoffeeMachineStatus();
    if (targetReached) {
      if (currentIntervalId) {
        clearInterval(currentIntervalId);
        currentIntervalId = null;
      }
      
      console.log(`Target temperature reached! Starting ${RESTART_DELAY_MS / 1000} second timer...`);
      
      setTimeout(() => {
        console.log(`${RESTART_DELAY_MS / 1000} seconds have passed. Restarting monitoring...`);
        notificationSent = false;
        isMachineOnline = false;
        startMonitoring();
      }, RESTART_DELAY_MS);
    }
  };

  // Initial check immediately
  await poll();

  // Start with offline polling interval
  currentIntervalId = setInterval(poll, OFFLINE_POLLING_INTERVAL_MS);
}

// Start the monitoring process
startMonitoring();

// Export functions for testing
module.exports = {
  sendDiscordNotification,
  sendSmsNotification,
  sendNotification,
  checkCoffeeMachineStatus,
  TEMPERATURE_VARIANCE,
  DISCORD_ENABLED,
  TWILIO_ENABLED,
  DISCORD_WEBHOOK_URL,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  YOUR_PHONE_NUMBER
};