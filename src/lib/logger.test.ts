
// Mock crashlytics
jest.mock('@react-native-firebase/crashlytics', () => {
    const log = jest.fn();
    const recordError = jest.fn();
    return () => ({
        log,
        recordError,
    });
});

describe('Logger', () => {
    const originalDev = global.__DEV__;
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    beforeEach(() => {
        consoleErrorSpy.mockClear();
    });

    afterAll(() => {
        global.__DEV__ = originalDev;
        consoleErrorSpy.mockRestore();
    });

    describe('development mode', () => {
        beforeEach(() => {
            global.__DEV__ = true;
            jest.resetModules();
        });

        it('should log error to console', () => {
            const Logger = require('./logger').default;
            const crashlyticsModule = require('@react-native-firebase/crashlytics');
            const crashlytics = crashlyticsModule.default || crashlyticsModule;

            // console.log('crashlyticsModule:', crashlyticsModule);
            // console.log('crashlytics:', crashlytics);

            const message = 'Test error message';
            const error = new Error('Test error');

            Logger.error(message, error);

            expect(consoleErrorSpy).toHaveBeenCalledWith(`[ERROR] ${message}`, error);
            expect(crashlytics().recordError).not.toHaveBeenCalled();
        });
    });

    describe('production mode', () => {
        beforeEach(() => {
            global.__DEV__ = false;
            jest.resetModules();
        });

        it('should log error to crashlytics', () => {
            const Logger = require('./logger').default;
            const crashlyticsModule = require('@react-native-firebase/crashlytics');
            const crashlytics = crashlyticsModule.default || crashlyticsModule;

            const message = 'Test error message';
            const error = new Error('Test error');

            Logger.error(message, error);

            expect(consoleErrorSpy).not.toHaveBeenCalled();

            expect(crashlytics().log).toHaveBeenCalledWith(message);
            expect(crashlytics().recordError).toHaveBeenCalledWith(error);
        });

         it('should create an error object if only message is provided', () => {
            const Logger = require('./logger').default;
            const crashlyticsModule = require('@react-native-firebase/crashlytics');
            const crashlytics = crashlyticsModule.default || crashlyticsModule;

            const message = 'Test error message';

            Logger.error(message);

            expect(crashlytics().log).toHaveBeenCalledWith(message);
            expect(crashlytics().recordError).toHaveBeenCalledWith(expect.any(Error));
            const recordedError = (crashlytics().recordError as jest.Mock).mock.calls[0][0];
            expect(recordedError.message).toBe(message);
        });

        it('should wrap non-Error objects in an Error', () => {
            const Logger = require('./logger').default;
            const crashlyticsModule = require('@react-native-firebase/crashlytics');
            const crashlytics = crashlyticsModule.default || crashlyticsModule;

            const message = 'Test error message';
            const rawError = 'Something went wrong string';

            Logger.error(message, rawError);

            expect(crashlytics().log).toHaveBeenCalledWith(message);
            expect(crashlytics().recordError).toHaveBeenCalledWith(expect.any(Error));

            const recordedError = (crashlytics().recordError as jest.Mock).mock.calls[0][0];
            // We expect the error message to contain the raw error string
            expect(recordedError.message).toContain(rawError);
        });
    });
});
