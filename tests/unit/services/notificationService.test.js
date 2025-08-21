describe('Notification Service', () => {
  let sendNotification;
  let mockDiscordService;
  let mockTwilioService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  test('should send both Discord and SMS notifications', async () => {
    // Mock Discord service
    mockDiscordService = {
      sendDiscordNotification: jest.fn().mockResolvedValue(undefined)
    };
    
    // Mock Twilio service
    mockTwilioService = {
      sendSmsNotification: jest.fn().mockResolvedValue(undefined)
    };
    
    jest.doMock('../../../src/services/discordService', () => mockDiscordService);
    jest.doMock('../../../src/services/twilioService', () => mockTwilioService);
    
    // Import the service
    const notificationService = require('../../../src/services/notificationService');
    sendNotification = notificationService.sendNotification;
    
    const message = 'Test notification';
    await sendNotification(message);
    
    expect(mockDiscordService.sendDiscordNotification).toHaveBeenCalledWith(message);
    expect(mockTwilioService.sendSmsNotification).toHaveBeenCalledWith(message);
  });

  test('should handle errors gracefully', async () => {
    // Mock Discord service with error
    mockDiscordService = {
      sendDiscordNotification: jest.fn().mockRejectedValue(new Error('Discord error'))
    };
    
    // Mock Twilio service with error
    mockTwilioService = {
      sendSmsNotification: jest.fn().mockRejectedValue(new Error('Twilio error'))
    };
    
    jest.doMock('../../../src/services/discordService', () => mockDiscordService);
    jest.doMock('../../../src/services/twilioService', () => mockTwilioService);
    
    // Import the service
    const notificationService = require('../../../src/services/notificationService');
    sendNotification = notificationService.sendNotification;
    
    const message = 'Test notification';
    
    // Should throw error since Promise.all rejects if any promise rejects
    await expect(sendNotification(message)).rejects.toThrow('Discord error');
    
    expect(mockDiscordService.sendDiscordNotification).toHaveBeenCalledWith(message);
    expect(mockTwilioService.sendSmsNotification).toHaveBeenCalledWith(message);
  });
});
