const axios = require('axios');

// Mock axios before importing the module
jest.mock('axios');

// Mock Twilio client
const mockTwilioClient = {
  messages: {
    create: jest.fn().mockResolvedValue({ sid: 'test_sid' })
  }
};

jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => mockTwilioClient);
});

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DEBUG = 'true';
process.env.DISCORD_ENABLED = 'false';
process.env.TWILIO_ENABLED = 'false';
process.env.COFFEE_MACHINE_API_URL = 'http://test.local/api/system/status';

// Import the module after mocking
const notificationModule = require('./notification');

describe('Coffee Machine Notification System', () => {
  let mockAxios;
  let consoleSpy;
  let setTimeoutSpy;
  let setIntervalSpy;
  let clearIntervalSpy;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Spy on console methods
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation()
    };

    // Spy on timers
    setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    setIntervalSpy = jest.spyOn(global, 'setInterval');
    clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    // Mock axios
    mockAxios = axios;
  });

  afterEach(() => {
    // Restore console methods
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
    
    // Restore timers
    setTimeoutSpy.mockRestore();
    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });

  describe('Interval Management', () => {
    test('should properly clear old interval when switching polling rates', async () => {
      // Reset state first
      notificationModule.resetMonitoringState();
      
      // Start monitoring to set up initial interval
      await notificationModule.startMonitoring();
      
      // Mock successful API response (machine online)
      mockAxios.get.mockResolvedValue({
        data: [{
          temperature: '90',
          targetTemperature: '95',
          upTime: '120' // 2 minutes (past startup delay)
        }]
      });

      // Call checkCoffeeMachineStatus to trigger online state
      const result = await notificationModule.checkCoffeeMachineStatus();
      
      // Verify that clearInterval was called (indicating old interval was cleared)
      expect(clearIntervalSpy).toHaveBeenCalled();
      
      // Verify that setInterval was called with online polling rate (5 seconds)
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 5000);
    });

    test('should switch to offline polling when machine goes offline', async () => {
      // Reset state first
      notificationModule.resetMonitoringState();
      
      // First, mock machine as online
      mockAxios.get.mockResolvedValue({
        data: [{
          temperature: '90',
          targetTemperature: '95',
          upTime: '120'
        }]
      });

      await notificationModule.checkCoffeeMachineStatus();

      // Now mock machine as offline (timeout error)
      mockAxios.get.mockRejectedValue({
        message: 'timeout of 10000ms exceeded'
      });

      // Call again to trigger offline state
      await notificationModule.checkCoffeeMachineStatus();

      // Verify that clearInterval was called again
      expect(clearIntervalSpy).toHaveBeenCalledTimes(2);
      
      // Verify that setInterval was called with offline polling rate (30 seconds)
      expect(setIntervalSpy).toHaveBeenLastCalledWith(expect.any(Function), 30000);
    });

    test('should not create multiple intervals simultaneously', async () => {
      // Mock machine as online
      mockAxios.get.mockResolvedValue({
        data: [{
          temperature: '90',
          targetTemperature: '95',
          upTime: '120'
        }]
      });

      // Call multiple times to simulate rapid state changes
      await notificationModule.checkCoffeeMachineStatus();
      await notificationModule.checkCoffeeMachineStatus();
      await notificationModule.checkCoffeeMachineStatus();

      // Should only have one setInterval call (the last one)
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
      
      // Should have corresponding clearInterval calls
      expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Startup Delay', () => {
    test('should not check temperature during startup delay', async () => {
      // Mock machine response with uptime < startup delay
      mockAxios.get.mockResolvedValue({
        data: [{
          temperature: '95',
          targetTemperature: '95',
          upTime: '30' // 30 seconds (less than 2 minute startup delay)
        }]
      });

      const result = await notificationModule.checkCoffeeMachineStatus();
      
      // Should not return true (target temperature not reached) due to startup delay
      expect(result).toBe(false);
    });

    test('should check temperature after startup delay', async () => {
      // Mock machine response with uptime > startup delay
      mockAxios.get.mockResolvedValue({
        data: [{
          temperature: '95',
          targetTemperature: '95',
          upTime: '150' // 2.5 minutes (past startup delay)
        }]
      });

      const result = await notificationModule.checkCoffeeMachineStatus();
      
      // Should return true (target temperature reached) after startup delay
      expect(result).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle timeout errors as offline state', async () => {
      mockAxios.get.mockRejectedValue({
        message: 'timeout of 10000ms exceeded'
      });

      await notificationModule.checkCoffeeMachineStatus();
      
      // Should trigger offline handling
      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000);
    });

    test('should handle connection refused errors as offline state', async () => {
      // Reset state first
      notificationModule.resetMonitoringState();
      
      // Start monitoring to set up initial interval
      await notificationModule.startMonitoring();
      
      mockAxios.get.mockRejectedValue({
        code: 'ECONNREFUSED'
      });

      await notificationModule.checkCoffeeMachineStatus();
      
      // Should trigger offline handling
      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000);
    });
  });

  describe('State Transitions', () => {
    test('should properly track online/offline state changes', async () => {
      // Reset state first
      notificationModule.resetMonitoringState();
      
      // Start monitoring to set up initial interval
      await notificationModule.startMonitoring();
      
      // Start with machine offline
      mockAxios.get.mockRejectedValue({
        message: 'timeout of 10000ms exceeded'
      });

      await notificationModule.checkCoffeeMachineStatus();
      
      // Should be in offline state
      expect(setIntervalSpy).toHaveBeenLastCalledWith(expect.any(Function), 30000);

      // Now bring machine online
      mockAxios.get.mockResolvedValue({
        data: [{
          temperature: '90',
          targetTemperature: '95',
          upTime: '120'
        }]
      });

      await notificationModule.checkCoffeeMachineStatus();
      
      // Should switch to online state
      expect(setIntervalSpy).toHaveBeenLastCalledWith(expect.any(Function), 5000);
    });
  });
});
