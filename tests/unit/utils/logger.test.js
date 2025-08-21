describe('Logger Utility', () => {
  let consoleSpy;
  let debugLog;
  
  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Clear module cache
    jest.resetModules();
  });
  
  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test('should not log when DEBUG_ENABLED is false', () => {
    // Mock config with DEBUG_ENABLED = false
    jest.doMock('../../../src/config', () => ({
      DEBUG_ENABLED: false
    }));
    
    const logger = require('../../../src/utils/logger');
    debugLog = logger.debugLog;
    
    debugLog('Test message');
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  test('should log when DEBUG_ENABLED is true', () => {
    // Mock config with DEBUG_ENABLED = true
    jest.doMock('../../../src/config', () => ({
      DEBUG_ENABLED: true
    }));
    
    const logger = require('../../../src/utils/logger');
    debugLog = logger.debugLog;
    
    debugLog('Test message');
    expect(consoleSpy).toHaveBeenCalledWith('[DEBUG] Test message');
  });
});
