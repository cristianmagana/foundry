/**
 * Unit tests for Logger utilities
 */

import {getLogger} from '../logger';

describe('Logger', () => {
    describe('getLogger', () => {
        const originalEnv = process.env.LOG_LEVEL;

        afterEach(() => {
            // Restore original environment
            if (originalEnv) {
                process.env.LOG_LEVEL = originalEnv;
            } else {
                delete process.env.LOG_LEVEL;
            }
        });

        describe('when LOG_LEVEL is set', () => {
            it('should create logger with specified log level', () => {
                // Given: LOG_LEVEL environment variable is set
                process.env.LOG_LEVEL = 'debug';

                // When: Creating logger
                const logger = getLogger('test-app');

                // Then: Should return logger with debug level
                expect(logger).toBeDefined();
                expect(logger.getLevel()).toBe(1); // debug = 1
            });

            it('should handle warn level', () => {
                // Given: LOG_LEVEL set to warn
                process.env.LOG_LEVEL = 'warn';

                // When: Creating logger
                const logger = getLogger('test-app');

                // Then: Should have warn level
                expect(logger.getLevel()).toBe(3); // warn = 3
            });

            it('should handle error level', () => {
                // Given: LOG_LEVEL set to error
                process.env.LOG_LEVEL = 'error';

                // When: Creating logger
                const logger = getLogger('test-app');

                // Then: Should have error level
                expect(logger.getLevel()).toBe(4); // error = 4
            });
        });

        describe('when LOG_LEVEL is not set', () => {
            it('should default to info level', () => {
                // Given: No LOG_LEVEL environment variable
                delete process.env.LOG_LEVEL;

                // When: Creating logger
                const logger = getLogger('default-app');

                // Then: Should default to info level
                expect(logger).toBeDefined();
                expect(logger.getLevel()).toBe(2); // info = 2
            });
        });

        describe('when creating multiple loggers', () => {
            it('should create loggers with different names', () => {
                // Given: Creating multiple loggers
                const logger1 = getLogger('app1');
                const logger2 = getLogger('app2');

                // Then: Both should be valid loggers
                expect(logger1).toBeDefined();
                expect(logger2).toBeDefined();
            });
        });
    });
});
