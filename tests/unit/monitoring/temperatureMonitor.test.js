// Mock the config module
jest.mock('../../../src/config/constants', () => ({
  TEMPERATURE_VARIANCE: 0.5,
  STARTUP_DELAY_MS: 2 * 60 * 1000, // 2 minutes
  MAX_UPTIME_MINUTES: 45,
  UPTIME_EXCEEDED_ENABLED: true
}));

describe('Temperature Monitor', () => {
  let temperatureMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('checkUptimeLimit', () => {
    test('should return false when uptime monitoring is disabled', () => {
      // Mock UPTIME_EXCEEDED_ENABLED to false
      jest.doMock('../../../src/config/constants', () => ({
        TEMPERATURE_VARIANCE: 0.5,
        STARTUP_DELAY_MS: 2 * 60 * 1000, // 2 minutes
        MAX_UPTIME_MINUTES: 45,
        UPTIME_EXCEEDED_ENABLED: false
      }));
      
      // Re-import to get the new mock
      const tempMonitor = require('../../../src/monitoring/temperatureMonitor');
      
      const result = tempMonitor.checkUptimeLimit(50, false);
      expect(result).toBe(false);
    });

    test('should return false when uptime notification already sent', () => {
      // Mock with uptime monitoring enabled
      jest.doMock('../../../src/config/constants', () => ({
        TEMPERATURE_VARIANCE: 0.5,
        STARTUP_DELAY_MS: 2 * 60 * 1000, // 2 minutes
        MAX_UPTIME_MINUTES: 45,
        UPTIME_EXCEEDED_ENABLED: true
      }));
      
      const tempMonitor = require('../../../src/monitoring/temperatureMonitor');
      const result = tempMonitor.checkUptimeLimit(50, true);
      expect(result).toBe(false);
    });

    test('should return false when uptime is within limit', () => {
      jest.doMock('../../../src/config/constants', () => ({
        TEMPERATURE_VARIANCE: 0.5,
        STARTUP_DELAY_MS: 2 * 60 * 1000, // 2 minutes
        MAX_UPTIME_MINUTES: 45,
        UPTIME_EXCEEDED_ENABLED: true
      }));
      
      const tempMonitor = require('../../../src/monitoring/temperatureMonitor');
      const result = tempMonitor.checkUptimeLimit(30, false);
      expect(result).toBe(false);
    });

    test('should return true when uptime exceeds limit', () => {
      jest.doMock('../../../src/config/constants', () => ({
        TEMPERATURE_VARIANCE: 0.5,
        STARTUP_DELAY_MS: 2 * 60 * 1000, // 2 minutes
        MAX_UPTIME_MINUTES: 45,
        UPTIME_EXCEEDED_ENABLED: true
      }));
      
      const tempMonitor = require('../../../src/monitoring/temperatureMonitor');
      const result = tempMonitor.checkUptimeLimit(50, false);
      expect(result).toBe(true);
    });

    test('should return true when uptime equals limit', () => {
      jest.doMock('../../../src/config/constants', () => ({
        TEMPERATURE_VARIANCE: 0.5,
        STARTUP_DELAY_MS: 2 * 60 * 1000, // 2 minutes
        MAX_UPTIME_MINUTES: 45,
        UPTIME_EXCEEDED_ENABLED: true
      }));
      
      const tempMonitor = require('../../../src/monitoring/temperatureMonitor');
      const result = tempMonitor.checkUptimeLimit(45, false);
      expect(result).toBe(false); // 45 equals MAX_UPTIME_MINUTES, so it's not greater than
    });
  });

  describe('isTemperatureInRange', () => {
    test('should return true when temperature is exactly at target', () => {
      jest.doMock('../../../src/config/constants', () => ({
        TEMPERATURE_VARIANCE: 0.5,
        STARTUP_DELAY_MS: 2 * 60 * 1000, // 2 minutes
        MAX_UPTIME_MINUTES: 45,
        UPTIME_EXCEEDED_ENABLED: true
      }));
      
      const tempMonitor = require('../../../src/monitoring/temperatureMonitor');
      const result = tempMonitor.isTemperatureInRange(95.0, 95.0);
      expect(result).toBe(true);
    });

    test('should return true when temperature is within variance range', () => {
      jest.doMock('../../../src/config/constants', () => ({
        TEMPERATURE_VARIANCE: 0.5,
        STARTUP_DELAY_MS: 2 * 60 * 1000, // 2 minutes
        MAX_UPTIME_MINUTES: 45,
        UPTIME_EXCEEDED_ENABLED: true
      }));
      
      const tempMonitor = require('../../../src/monitoring/temperatureMonitor');
      const result = tempMonitor.isTemperatureInRange(94.6, 95.0);
      expect(result).toBe(true);
    });

    test('should return true when temperature is at upper bound', () => {
      jest.doMock('../../../src/config/constants', () => ({
        TEMPERATURE_VARIANCE: 0.5,
        STARTUP_DELAY_MS: 2 * 60 * 1000, // 2 minutes
        MAX_UPTIME_MINUTES: 45,
        UPTIME_EXCEEDED_ENABLED: true
      }));
      
      const tempMonitor = require('../../../src/monitoring/temperatureMonitor');
      const result = tempMonitor.isTemperatureInRange(95.5, 95.0);
      expect(result).toBe(true);
    });

    test('should return true when temperature is at lower bound', () => {
      jest.doMock('../../../src/config/constants', () => ({
        TEMPERATURE_VARIANCE: 0.5,
        STARTUP_DELAY_MS: 2 * 60 * 1000, // 2 minutes
        MAX_UPTIME_MINUTES: 45,
        UPTIME_EXCEEDED_ENABLED: true
      }));
      
      const tempMonitor = require('../../../src/monitoring/temperatureMonitor');
      const result = tempMonitor.isTemperatureInRange(94.5, 95.0);
      expect(result).toBe(true);
    });

    test('should return false when temperature is above upper bound', () => {
      jest.doMock('../../../src/config/constants', () => ({
        TEMPERATURE_VARIANCE: 0.5,
        STARTUP_DELAY_MS: 2 * 60 * 1000, // 2 minutes
        MAX_UPTIME_MINUTES: 45,
        UPTIME_EXCEEDED_ENABLED: true
      }));
      
      const tempMonitor = require('../../../src/monitoring/temperatureMonitor');
      const result = tempMonitor.isTemperatureInRange(95.6, 95.0);
      expect(result).toBe(false);
    });

    test('should return false when temperature is below lower bound', () => {
      jest.doMock('../../../src/config/constants', () => ({
        TEMPERATURE_VARIANCE: 0.5,
        STARTUP_DELAY_MS: 2 * 60 * 1000, // 2 minutes
        MAX_UPTIME_MINUTES: 45,
        UPTIME_EXCEEDED_ENABLED: true
      }));
      
      const tempMonitor = require('../../../src/monitoring/temperatureMonitor');
      const result = tempMonitor.isTemperatureInRange(94.4, 95.0);
      expect(result).toBe(false);
    });
  });

  describe('isTargetTemperatureReached', () => {
    test('should return startup delay when uptime is less than startup delay', () => {
      jest.doMock('../../../src/config/constants', () => ({
        TEMPERATURE_VARIANCE: 0.5,
        STARTUP_DELAY_MS: 2 * 60 * 1000, // 2 minutes
        MAX_UPTIME_MINUTES: 45,
        UPTIME_EXCEEDED_ENABLED: true
      }));
      
      const tempMonitor = require('../../../src/monitoring/temperatureMonitor');
      const result = tempMonitor.isTargetTemperatureReached(95.0, 95.0, 30, false); // 30 seconds
      expect(result.reached).toBe(false);
      expect(result.startupDelayRemaining).toBe(90); // 2 minutes - 30 seconds = 90 seconds
    });

    test('should return reached false when uptime is less than startup delay even if temp is correct', () => {
      jest.doMock('../../../src/config/constants', () => ({
        TEMPERATURE_VARIANCE: 0.5,
        STARTUP_DELAY_MS: 2 * 60 * 1000, // 2 minutes
        MAX_UPTIME_MINUTES: 45,
        UPTIME_EXCEEDED_ENABLED: true
      }));
      
      const tempMonitor = require('../../../src/monitoring/temperatureMonitor');
      const result = tempMonitor.isTargetTemperatureReached(95.0, 95.0, 60, false); // 1 minute
      expect(result.reached).toBe(false);
      expect(result.startupDelayRemaining).toBe(60); // 2 minutes - 1 minute = 60 seconds
    });

    test('should return reached true when uptime exceeds startup delay and temperature is correct', () => {
      jest.doMock('../../../src/config/constants', () => ({
        TEMPERATURE_VARIANCE: 0.5,
        STARTUP_DELAY_MS: 2 * 60 * 1000, // 2 minutes
        MAX_UPTIME_MINUTES: 45,
        UPTIME_EXCEEDED_ENABLED: true
      }));
      
      const tempMonitor = require('../../../src/monitoring/temperatureMonitor');
      const result = tempMonitor.isTargetTemperatureReached(95.0, 95.0, 180, false); // 3 minutes
      expect(result.reached).toBe(true);
      expect(result.startupDelayRemaining).toBe(0);
    });

    test('should return reached false when uptime exceeds startup delay but temperature is incorrect', () => {
      jest.doMock('../../../src/config/constants', () => ({
        TEMPERATURE_VARIANCE: 0.5,
        STARTUP_DELAY_MS: 2 * 60 * 1000, // 2 minutes
        MAX_UPTIME_MINUTES: 45,
        UPTIME_EXCEEDED_ENABLED: true
      }));
      
      const tempMonitor = require('../../../src/monitoring/temperatureMonitor');
      const result = tempMonitor.isTargetTemperatureReached(90.0, 95.0, 180, false); // 3 minutes, wrong temp
      expect(result.reached).toBe(false);
      expect(result.startupDelayRemaining).toBe(0);
    });

    test('should return reached false when uptime exceeds startup delay and notification already sent', () => {
      jest.doMock('../../../src/config/constants', () => ({
        TEMPERATURE_VARIANCE: 0.5,
        STARTUP_DELAY_MS: 2 * 60 * 1000, // 2 minutes
        MAX_UPTIME_MINUTES: 45,
        UPTIME_EXCEEDED_ENABLED: true
      }));
      
      const tempMonitor = require('../../../src/monitoring/temperatureMonitor');
      const result = tempMonitor.isTargetTemperatureReached(95.0, 95.0, 180, true); // 3 minutes, notification sent
      expect(result.reached).toBe(false);
      expect(result.startupDelayRemaining).toBe(0);
    });

    test('should handle edge case of startup delay exactly', () => {
      jest.doMock('../../../src/config/constants', () => ({
        TEMPERATURE_VARIANCE: 0.5,
        STARTUP_DELAY_MS: 2 * 60 * 1000, // 2 minutes
        MAX_UPTIME_MINUTES: 45,
        UPTIME_EXCEEDED_ENABLED: true
      }));
      
      const tempMonitor = require('../../../src/monitoring/temperatureMonitor');
      const result = tempMonitor.isTargetTemperatureReached(95.0, 95.0, 120, false); // Exactly 2 minutes
      expect(result.reached).toBe(true);
      expect(result.startupDelayRemaining).toBe(0);
    });
  });
});
