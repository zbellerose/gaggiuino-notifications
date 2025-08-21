// Mock the config module
jest.mock('../../../src/config/constants', () => ({
  ONLINE_POLLING_INTERVAL_MS: 5000,  // 5 seconds
  OFFLINE_POLLING_INTERVAL_MS: 30000, // 30 seconds
  RESTART_DELAY_MS: 1800000 // 30 minutes
}));

// Mock the logger
jest.mock('../../../src/utils/logger', () => ({
  debugLog: jest.fn()
}));

describe('State Manager', () => {
  let stateManager;
  let mockLogger;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    jest.useFakeTimers();

    // Get mock references
    mockLogger = require('../../../src/utils/logger');

    // Import the module under test
    stateManager = require('../../../src/monitoring/stateManager');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('resetMonitoringState', () => {
    test('should reset all monitoring state flags', () => {
      // Set some state first
      stateManager.setNotificationSent(true);
      stateManager.setUptimeNotificationSent(true);
      
      // Reset state
      stateManager.resetMonitoringState();
      
      // Check that state was reset
      const state = stateManager.getState();
      expect(state.notificationSent).toBe(false);
      expect(state.isMachineOnline).toBe(false);
      expect(state.uptimeStartTime).toBe(null);
      expect(state.uptimeNotificationSent).toBe(false);
    });
  });

  describe('handleMachineOnline', () => {
    test('should set machine online and restart polling with online interval', () => {
      const mockPollFunction = jest.fn();
      
      stateManager.handleMachineOnline(mockPollFunction);
      
      const state = stateManager.getState();
      expect(state.isMachineOnline).toBe(true);
      expect(state.uptimeStartTime).toBeGreaterThan(0);
      expect(state.uptimeNotificationSent).toBe(false);
      
      // Should call restartPolling with online interval
      expect(mockLogger.debugLog).toHaveBeenCalledWith(
        'Switched to online polling interval: 5 seconds'
      );
    });

    test('should update uptime start time when called multiple times', () => {
      const mockPollFunction = jest.fn();
      
      // First call
      stateManager.handleMachineOnline(mockPollFunction);
      const firstUptime = stateManager.getUptimeStartTime();
      
      // Wait a bit
      jest.advanceTimersByTime(1000);
      
      // Second call
      stateManager.handleMachineOnline(mockPollFunction);
      const secondUptime = stateManager.getUptimeStartTime();
      
      expect(secondUptime).toBeGreaterThan(firstUptime);
    });
  });

  describe('handleMachineOffline', () => {
    test('should set machine offline and restart polling with offline interval', () => {
      const mockPollFunction = jest.fn();
      
      // First set machine online
      stateManager.handleMachineOnline(mockPollFunction);
      
      // Then set offline
      stateManager.handleMachineOffline(mockPollFunction);
      
      const state = stateManager.getState();
      expect(state.isMachineOnline).toBe(false);
      expect(state.uptimeStartTime).toBe(null);
      expect(state.uptimeNotificationSent).toBe(false);
      
      // Should call restartPolling with offline interval
      expect(mockLogger.debugLog).toHaveBeenCalledWith(
        'Switched to offline polling interval: 30 seconds'
      );
    });
  });

  describe('restartPolling', () => {
    test('should clear existing interval and set new one', () => {
      const mockPollFunction = jest.fn();
      const newInterval = 10000; // 10 seconds
      
      // Set up a mock interval ID by calling restartPolling first
      stateManager.restartPolling(5000, mockPollFunction);
      const firstIntervalId = stateManager.getCurrentIntervalId();
      
      // Now call restartPolling again with new interval
      stateManager.restartPolling(newInterval, mockPollFunction);
      const secondIntervalId = stateManager.getCurrentIntervalId();
      
      // Should have different interval IDs
      expect(secondIntervalId).not.toBe(firstIntervalId);
      expect(mockLogger.debugLog).toHaveBeenCalledWith(
        'Polling interval changed to 10 seconds'
      );
    });

    test('should handle case when no existing interval', () => {
      const mockPollFunction = jest.fn();
      const newInterval = 10000;
      
      // Ensure no existing interval
      stateManager.clearCurrentInterval();
      
      stateManager.restartPolling(newInterval, mockPollFunction);
      
      expect(stateManager.getCurrentIntervalId()).not.toBe(null);
      expect(mockLogger.debugLog).toHaveBeenCalledWith(
        'Polling interval changed to 10 seconds'
      );
    });
  });

  describe('getState', () => {
    test('should return current state object', () => {
      const state = stateManager.getState();
      
      expect(state).toHaveProperty('notificationSent');
      expect(state).toHaveProperty('isMachineOnline');
      expect(state).toHaveProperty('currentIntervalId');
      expect(state).toHaveProperty('uptimeStartTime');
      expect(state).toHaveProperty('uptimeNotificationSent');
    });

    test('should return correct initial state', () => {
      const state = stateManager.getState();
      
      expect(state.notificationSent).toBe(false);
      expect(state.isMachineOnline).toBe(false);
      expect(state.currentIntervalId).toBe(null);
      expect(state.uptimeStartTime).toBe(null);
      expect(state.uptimeNotificationSent).toBe(false);
    });
  });

  describe('setNotificationSent', () => {
    test('should set notification sent flag', () => {
      stateManager.setNotificationSent(true);
      expect(stateManager.getNotificationSent()).toBe(true);
      
      stateManager.setNotificationSent(false);
      expect(stateManager.getNotificationSent()).toBe(false);
    });
  });

  describe('setUptimeNotificationSent', () => {
    test('should set uptime notification sent flag', () => {
      stateManager.setUptimeNotificationSent(true);
      expect(stateManager.getUptimeNotificationSent()).toBe(true);
      
      stateManager.setUptimeNotificationSent(false);
      expect(stateManager.getUptimeNotificationSent()).toBe(false);
    });
  });

  describe('getUptimeStartTime', () => {
    test('should return uptime start time', () => {
      expect(stateManager.getUptimeStartTime()).toBe(null);
      
      const mockPollFunction = jest.fn();
      stateManager.handleMachineOnline(mockPollFunction);
      
      expect(stateManager.getUptimeStartTime()).toBeGreaterThan(0);
    });
  });

  describe('getMachineOnlineStatus', () => {
    test('should return machine online status', () => {
      expect(stateManager.getMachineOnlineStatus()).toBe(false);
      
      const mockPollFunction = jest.fn();
      stateManager.handleMachineOnline(mockPollFunction);
      
      expect(stateManager.getMachineOnlineStatus()).toBe(true);
    });
  });

  describe('clearCurrentInterval', () => {
    test('should clear current interval', () => {
      // First set up an interval
      const mockPollFunction = jest.fn();
      stateManager.restartPolling(5000, mockPollFunction);
      expect(stateManager.getCurrentIntervalId()).not.toBe(null);
      
      // Now clear it
      stateManager.clearCurrentInterval();
      
      expect(stateManager.getCurrentIntervalId()).toBe(null);
    });

    test('should handle case when no interval to clear', () => {
      // Ensure no interval exists
      stateManager.clearCurrentInterval();
      
      // Should not throw an error
      expect(stateManager.getCurrentIntervalId()).toBe(null);
    });
  });

  describe('getCurrentIntervalId', () => {
    test('should return current interval ID', () => {
      expect(stateManager.getCurrentIntervalId()).toBe(null);
    });
  });

  describe('getNotificationSent', () => {
    test('should return notification sent status', () => {
      expect(stateManager.getNotificationSent()).toBe(false);
      
      stateManager.setNotificationSent(true);
      expect(stateManager.getNotificationSent()).toBe(true);
    });
  });

  describe('getUptimeNotificationSent', () => {
    test('should return uptime notification sent status', () => {
      expect(stateManager.getUptimeNotificationSent()).toBe(false);
      
      stateManager.setUptimeNotificationSent(true);
      expect(stateManager.getUptimeNotificationSent()).toBe(true);
    });
  });
});
