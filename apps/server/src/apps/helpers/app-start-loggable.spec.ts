import { AppStartLoggable } from './app-start-loggable';

describe('AppStartLoggable', () => {
	describe('getLogMessage', () => {
		const expectedLogMessage = 'Successfully started listening...';
		const testAppName = 'Main app';
		const testPort = 3030;

		describe('should return loggable with proper content', () => {
			it('in case of just a default fields presence', () => {
				const testLoggable = new AppStartLoggable(testAppName, testPort).getLogMessage();

				expect(testLoggable).toHaveProperty('message', expectedLogMessage);
				expect(testLoggable).toHaveProperty('data');
				expect(testLoggable.data).toMatchObject({ appName: testAppName, port: testPort });
				expect(testLoggable.data).not.toHaveProperty('mounts');
			});

			it('in case of both default and non-default fields presence', () => {
				const testMounts = '/, /api, /api/v1 --> FeathersJS, /api/v3 --> NestJS';

				const testLoggable = new AppStartLoggable(testAppName, testPort, testMounts).getLogMessage();

				expect(testLoggable).toHaveProperty('message', expectedLogMessage);
				expect(testLoggable).toHaveProperty('data');
				expect(testLoggable.data).toMatchObject({ appName: testAppName, port: testPort, mounts: testMounts });
			});
		});
	});
});
