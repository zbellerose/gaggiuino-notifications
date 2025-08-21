describe('Twilio Service', () => {
  let sendSmsNotification;
  let mockTwilioClient;
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  test('should send SMS notification when enabled and configured', async () => {
    // Mock Twilio client
    mockTwilioClient = {
      messages: {
        create: jest.fn().mockResolvedValue({ sid: 'test-sid' })
      }
    };
    
    jest.doMock('twilio', () => jest.fn(() => mockTwilioClient));
    
    // Mock config with Twilio enabled
    jest.doMock('../../../src/config', () => ({
      TWILIO_ENABLED: true,
      TWILIO_ACCOUNT_SID: 'test-sid',
      TWILIO_AUTH_TOKEN: 'test-token',
      TWILIO_PHONE_NUMBER: '+1234567890',
      YOUR_PHONE_NUMBER: '+0987654321'
    }));
    
    // Mock logger
    jest.doMock('../../../src/utils/logger', () => ({
      debugLog: jest.fn()
    }));
    
    // Import the service
    const twilioService = require('../../../src/services/twilioService');
    sendSmsNotification = twilioService.sendSmsNotification;
    
    const message = 'Test SMS';
    await sendSmsNotification(message);
    
    expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
      body: message,
      to: '+0987654321',
      from: '+1234567890',
    });
  });

  test('should not send notification when Twilio is disabled', async () => {
    // Mock Twilio client
    mockTwilioClient = {
      messages: {
        create: jest.fn()
      }
    };
    
    jest.doMock('twilio', () => jest.fn(() => mockTwilioClient));
    
    // Mock config with Twilio disabled
    jest.doMock('../../../src/config', () => ({
      TWILIO_ENABLED: false,
      TWILIO_ACCOUNT_SID: 'test-sid',
      TWILIO_AUTH_TOKEN: 'test-token',
      TWILIO_PHONE_NUMBER: '+1234567890',
      YOUR_PHONE_NUMBER: '+0987654321'
    }));
    
    // Mock logger
    jest.doMock('../../../src/utils/logger', () => ({
      debugLog: jest.fn()
    }));
    
    // Import the service
    const twilioService = require('../../../src/services/twilioService');
    sendSmsNotification = twilioService.sendSmsNotification;
    
    const message = 'Test SMS';
    await sendSmsNotification(message);
    
    expect(mockTwilioClient.messages.create).not.toHaveBeenCalled();
  });
});
