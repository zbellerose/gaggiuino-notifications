const twilio = require("twilio");
const { TWILIO_ENABLED, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, YOUR_PHONE_NUMBER } = require('../config');
const { debugLog } = require('../utils/logger');

const client = new twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

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

module.exports = {
  sendSmsNotification
};
