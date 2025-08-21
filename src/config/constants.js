// Environment variable configuration
require('dotenv').config();

// Coffee Machine API Configuration
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

// Derived constants
const MAX_UPTIME_MINUTES = MAX_UPTIME_MS / 60000;
const RESTART_DELAY_SECONDS = RESTART_DELAY_MS / 1000;
const STARTUP_DELAY_SECONDS = STARTUP_DELAY_MS / 1000;

module.exports = {
  COFFEE_MACHINE_API_URL,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  YOUR_PHONE_NUMBER,
  DISCORD_WEBHOOK_URL,
  DISCORD_USER_ID,
  DISCORD_ENABLED,
  TWILIO_ENABLED,
  DEBUG_ENABLED,
  TEMPERATURE_VARIANCE,
  ONLINE_POLLING_INTERVAL_MS,
  OFFLINE_POLLING_INTERVAL_MS,
  RESTART_DELAY_MS,
  STARTUP_DELAY_MS,
  MAX_UPTIME_MS,
  UPTIME_EXCEEDED_ENABLED,
  MAX_UPTIME_MINUTES,
  RESTART_DELAY_SECONDS,
  STARTUP_DELAY_SECONDS
};
