describe('Discord Service', () => {
  let sendDiscordNotification;
  let axios;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Clear module cache
    jest.resetModules();
  });

  test('should send Discord notification when enabled and configured', async () => {
    // Mock axios
    jest.doMock('axios', () => ({
      post: jest.fn().mockResolvedValue({ status: 200 })
    }));
    
    // Mock config with Discord enabled
    jest.doMock('../../../src/config', () => ({
      DISCORD_ENABLED: true,
      DISCORD_WEBHOOK_URL: 'https://discord.com/api/webhooks/test',
      DISCORD_USER_ID: '123456789'
    }));
    
    // Mock logger
    jest.doMock('../../../src/utils/logger', () => ({
      debugLog: jest.fn()
    }));
    
    // Get the mocked axios
    axios = require('axios');
    
    // Import the service
    const discordService = require('../../../src/services/discordService');
    sendDiscordNotification = discordService.sendDiscordNotification;
    
    const message = 'Test notification';
    await sendDiscordNotification(message);
    
    expect(axios.post).toHaveBeenCalledWith(
      'https://discord.com/api/webhooks/test',
      {
        content: `☕ **Coffee Machine Alert** ☕\n<@123456789> ${message}`,
        username: 'Coffee Machine Bot',
        avatar_url: 'https://cdn-icons-png.flaticon.com/512/3137/3137064.png'
      }
    );
  });

  test('should not send notification when Discord is disabled', async () => {
    // Mock axios
    jest.doMock('axios', () => ({
      post: jest.fn()
    }));
    
    // Mock config with Discord disabled
    jest.doMock('../../../src/config', () => ({
      DISCORD_ENABLED: false,
      DISCORD_WEBHOOK_URL: 'https://discord.com/api/webhooks/test',
      DISCORD_USER_ID: '123456789'
    }));
    
    // Mock logger
    jest.doMock('../../../src/utils/logger', () => ({
      debugLog: jest.fn()
    }));
    
    // Get the mocked axios
    axios = require('axios');
    
    // Import the service
    const discordService = require('../../../src/services/discordService');
    sendDiscordNotification = discordService.sendDiscordNotification;
    
    const message = 'Test notification';
    await sendDiscordNotification(message);
    
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('should not send notification when webhook URL is missing', async () => {
    // Mock axios
    jest.doMock('axios', () => ({
      post: jest.fn()
    }));
    
    // Mock config with Discord enabled but no webhook
    jest.doMock('../../../src/config', () => ({
      DISCORD_ENABLED: true,
      DISCORD_WEBHOOK_URL: null,
      DISCORD_USER_ID: '123456789'
    }));
    
    // Mock logger
    jest.doMock('../../../src/utils/logger', () => ({
      debugLog: jest.fn()
    }));
    
    // Get the mocked axios
    axios = require('axios');
    
    // Import the service
    const discordService = require('../../../src/services/discordService');
    sendDiscordNotification = discordService.sendDiscordNotification;
    
    const message = 'Test notification';
    await sendDiscordNotification(message);
    
    expect(axios.post).not.toHaveBeenCalled();
  });
});
