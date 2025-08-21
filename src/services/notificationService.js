const { sendDiscordNotification } = require('./discordService');
const { sendSmsNotification } = require('./twilioService');

/**
 * Send both Discord and SMS notifications
 */
async function sendNotification(message) {
  await Promise.all([
    sendDiscordNotification(message),
    sendSmsNotification(message)
  ]);
}

module.exports = {
  sendNotification
};
