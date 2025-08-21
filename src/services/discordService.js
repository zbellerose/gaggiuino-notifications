const axios = require("axios");
const { DISCORD_ENABLED, DISCORD_WEBHOOK_URL, DISCORD_USER_ID } = require('../config');
const { debugLog } = require('../utils/logger');

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

module.exports = {
  sendDiscordNotification
};
