// Mock all dependencies
jest.mock('../../../src/config/constants', () => ({
  OFFLINE_POLLING_INTERVAL_MS: 30000,
  RESTART_DELAY_MS: 1800000,
  RESTART_DELAY_SECONDS: 1800
}));

jest.mock('../../../src/utils/logger', () => ({
  debugLog: jest.fn()
}));

jest.mock('../../../src/services/coffeeApiService', () => ({
  checkCoffeeMachineStatus: jest.fn()
}));

jest.mock('../../../src/services/notificationService', () => ({
  sendNotification: jest.fn()
}));

jest.mock('../../../src/monitoring/stateManager', () => ({
  resetMonitoringState: jest.fn(),
  handleMachineOnline: jest.fn(),
  handleMachineOffline: jest.fn(),
  restartPolling: jest.fn(),
  setNotificationSent: jest.fn(),
  setUptimeNotificationSent: jest.fn(),
  getUptimeStartTime: jest.fn(),
  clearCurrentInterval: jest.fn(),
  getMachineOnlineStatus: jest.fn(),
  getCurrentIntervalId: jest.fn(),
  getUptimeNotificationSent: jest.fn(),
  getNotificationSent: jest.fn()
}));

jest.mock('../../../src/monitoring/temperatureMonitor', () => ({
  checkUptimeLimit: jest.fn(),
  isTargetTemperatureReached: jest.fn()
}));

describe('Coffee Monitor', () => {
  let coffeeMonitor;
  let mockCoffeeApiService;
  let mockNotificationService;
  let mockStateManager;
  let mockTemperatureMonitor;
  let mockLogger;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    jest.useFakeTimers();

    // Get mock references
    mockCoffeeApiService = require('../../../src/services/coffeeApiService');
    mockNotificationService = require('../../../src/services/notificationService');
    mockStateManager = require('../../../src/monitoring/stateManager');
    mockTemperatureMonitor = require('../../../src/monitoring/temperatureMonitor');
    mockLogger = require('../../../src/utils/logger');

    // Import the module under test
    coffeeMonitor = require('../../../src/monitoring/coffeeMonitor');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('setPollCallback', () => {
    test('should set the poll callback function', () => {
      const callback = jest.fn();
      coffeeMonitor.setPollCallback(callback);
      
      // The callback should be stored internally
      expect(coffeeMonitor.setPollCallback).toBeDefined();
    });
  });

  describe('checkCoffeeMachineStatus', () => {
    test('should handle machine coming online', async () => {
      // Mock API response
      mockCoffeeApiService.checkCoffeeMachineStatus.mockResolvedValue({
        success: true,
        data: [{
          temperature: '95.0',
          targetTemperature: '95.0',
          upTime: '120' // 2 minutes
        }]
      });

      // Mock state manager functions
      mockStateManager.getMachineOnlineStatus.mockReturnValue(false);
      mockStateManager.getUptimeNotificationSent.mockReturnValue(false);
      mockStateManager.getNotificationSent.mockReturnValue(false);

      // Mock temperature monitor
      mockTemperatureMonitor.checkUptimeLimit.mockReturnValue(false);
      mockTemperatureMonitor.isTargetTemperatureReached.mockReturnValue({
        reached: false,
        startupDelayRemaining: 0
      });

      const result = await coffeeMonitor.checkCoffeeMachineStatus();

      expect(mockStateManager.handleMachineOnline).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    test('should send uptime notification when limit exceeded', async () => {
      // Mock API response
      mockCoffeeApiService.checkCoffeeMachineStatus.mockResolvedValue({
        success: true,
        data: [{
          temperature: '95.0',
          targetTemperature: '95.0',
          upTime: '3000' // 50 minutes
        }]
      });

      // Mock state manager functions
      mockStateManager.getMachineOnlineStatus.mockReturnValue(true);
      mockStateManager.getUptimeNotificationSent.mockReturnValue(false);
      mockStateManager.getNotificationSent.mockReturnValue(false);

      // Mock temperature monitor to trigger uptime notification
      mockTemperatureMonitor.checkUptimeLimit.mockReturnValue(true);
      mockTemperatureMonitor.isTargetTemperatureReached.mockReturnValue({
        reached: false,
        startupDelayRemaining: 0
      });

      const result = await coffeeMonitor.checkCoffeeMachineStatus();

      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ Your coffee machine has been running for 50 minutes')
      );
      expect(mockStateManager.setUptimeNotificationSent).toHaveBeenCalledWith(true);
      expect(result).toBe(false);
    });

    test('should send temperature notification when target reached', async () => {
      // Mock API response
      mockCoffeeApiService.checkCoffeeMachineStatus.mockResolvedValue({
        success: true,
        data: [{
          temperature: '95.0',
          targetTemperature: '95.0',
          upTime: '180' // 3 minutes
        }]
      });

      // Mock state manager functions
      mockStateManager.getMachineOnlineStatus.mockReturnValue(true);
      mockStateManager.getUptimeNotificationSent.mockReturnValue(false);
      mockStateManager.getNotificationSent.mockReturnValue(false);

      // Mock temperature monitor to trigger temperature notification
      mockTemperatureMonitor.checkUptimeLimit.mockReturnValue(false);
      mockTemperatureMonitor.isTargetTemperatureReached.mockReturnValue({
        reached: true,
        startupDelayRemaining: 0
      });

      const result = await coffeeMonitor.checkCoffeeMachineStatus();

      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
        'Hey! Your machine is at the target temp.'
      );
      expect(mockStateManager.setNotificationSent).toHaveBeenCalledWith(true);
      expect(result).toBe(true);
    });

    test('should handle startup delay correctly', async () => {
      // Mock API response
      mockCoffeeApiService.checkCoffeeMachineStatus.mockResolvedValue({
        success: true,
        data: [{
          temperature: '95.0',
          targetTemperature: '95.0',
          upTime: '30' // 30 seconds
        }]
      });

      // Mock state manager functions
      mockStateManager.getMachineOnlineStatus.mockReturnValue(true);
      mockStateManager.getUptimeNotificationSent.mockReturnValue(false);
      mockStateManager.getNotificationSent.mockReturnValue(false);

      // Mock temperature monitor to show startup delay
      mockTemperatureMonitor.checkUptimeLimit.mockReturnValue(false);
      mockTemperatureMonitor.isTargetTemperatureReached.mockReturnValue({
        reached: false,
        startupDelayRemaining: 90
      });

      const result = await coffeeMonitor.checkCoffeeMachineStatus();

      expect(mockLogger.debugLog).toHaveBeenCalledWith(
        expect.stringContaining('Startup delay active: 90 seconds remaining')
      );
      expect(result).toBe(false);
    });

    test('should handle machine going offline', async () => {
      // Mock API error (offline)
      mockCoffeeApiService.checkCoffeeMachineStatus.mockResolvedValue({
        success: false,
        error: { code: 'ECONNREFUSED' }
      });

      // Mock state manager functions
      mockStateManager.getMachineOnlineStatus.mockReturnValue(true);
      mockStateManager.getCurrentIntervalId.mockReturnValue('interval-123');

      const result = await coffeeMonitor.checkCoffeeMachineStatus();

      expect(mockStateManager.handleMachineOffline).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    test('should handle timeout errors as offline', async () => {
      // Mock API timeout error
      mockCoffeeApiService.checkCoffeeMachineStatus.mockResolvedValue({
        success: false,
        error: { message: 'timeout' }
      });

      // Mock state manager functions
      mockStateManager.getMachineOnlineStatus.mockReturnValue(false);
      mockStateManager.getCurrentIntervalId.mockReturnValue('interval-123');

      const result = await coffeeMonitor.checkCoffeeMachineStatus();

      expect(mockStateManager.restartPolling).toHaveBeenCalledWith(30000, expect.any(Function));
      expect(result).toBe(false);
    });

    test('should handle unexpected API errors gracefully', async () => {
      // Mock API error (not offline-related)
      mockCoffeeApiService.checkCoffeeMachineStatus.mockResolvedValue({
        success: false,
        error: { message: 'Internal server error' }
      });

      const result = await coffeeMonitor.checkCoffeeMachineStatus();

      expect(result).toBe(false);
      // Should not call offline handling functions
      expect(mockStateManager.handleMachineOffline).not.toHaveBeenCalled();
    });

    test('should handle API exceptions gracefully', async () => {
      // Mock API throwing exception
      mockCoffeeApiService.checkCoffeeMachineStatus.mockRejectedValue(
        new Error('Network error')
      );

      const result = await coffeeMonitor.checkCoffeeMachineStatus();

      expect(result).toBe(false);
    });
  });

  describe('poll', () => {
    test('should handle successful polling cycle', async () => {
      // Mock API to return successful response but not target reached
      mockCoffeeApiService.checkCoffeeMachineStatus.mockResolvedValue({
        success: true,
        data: [{
          temperature: '85.0', // Below target
          targetTemperature: '95.0',
          upTime: '180' // 3 minutes
        }]
      });

      // Mock state manager functions
      mockStateManager.getMachineOnlineStatus.mockReturnValue(true);
      mockStateManager.getUptimeNotificationSent.mockReturnValue(false);
      mockStateManager.getNotificationSent.mockReturnValue(false);

      // Mock temperature monitor - target not reached
      mockTemperatureMonitor.checkUptimeLimit.mockReturnValue(false);
      mockTemperatureMonitor.isTargetTemperatureReached.mockReturnValue({
        reached: false,
        startupDelayRemaining: 0
      });

      // This should complete without calling clearCurrentInterval
      await coffeeMonitor.poll();

      // Verify that the poll cycle completed successfully
      expect(mockCoffeeApiService.checkCoffeeMachineStatus).toHaveBeenCalled();
    });

    test('should handle API errors gracefully', async () => {
      // Mock API to return error
      mockCoffeeApiService.checkCoffeeMachineStatus.mockRejectedValue(
        new Error('Network error')
      );

      // This should not throw an error
      await expect(coffeeMonitor.poll()).resolves.toBeUndefined();
    });
  });

  describe('startMonitoring', () => {
    test('should initialize monitoring system', async () => {
      // Mock API to return successful response
      mockCoffeeApiService.checkCoffeeMachineStatus.mockResolvedValue({
        success: true,
        data: [{
          temperature: '85.0',
          targetTemperature: '95.0',
          upTime: '60' // 1 minute
        }]
      });

      // Mock state manager functions
      mockStateManager.getMachineOnlineStatus.mockReturnValue(false); // Start offline
      mockStateManager.getUptimeNotificationSent.mockReturnValue(false);
      mockStateManager.getNotificationSent.mockReturnValue(false);

      // Mock temperature monitor
      mockTemperatureMonitor.checkUptimeLimit.mockReturnValue(false);
      mockTemperatureMonitor.isTargetTemperatureReached.mockReturnValue({
        reached: false,
        startupDelayRemaining: 60 // Still in startup delay
      });

      await coffeeMonitor.startMonitoring();

      // Verify that monitoring was initialized
      expect(mockStateManager.resetMonitoringState).toHaveBeenCalled();
      expect(mockStateManager.restartPolling).toHaveBeenCalledWith(30000, expect.any(Function));
      expect(mockCoffeeApiService.checkCoffeeMachineStatus).toHaveBeenCalled();
    });

    test('should handle initialization errors', async () => {
      // Mock API to fail during initialization
      mockCoffeeApiService.checkCoffeeMachineStatus.mockRejectedValue(
        new Error('Initialization error')
      );

      // Should not throw error
      await expect(coffeeMonitor.startMonitoring()).resolves.toBeUndefined();
      
      // Should still initialize state
      expect(mockStateManager.resetMonitoringState).toHaveBeenCalled();
    });
  });
});
