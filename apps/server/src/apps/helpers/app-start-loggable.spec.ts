import { AppStartLoggable } from './app-start-loggable';

describe('AppStartLoggable', () => {
	describe('getLogMessage', () => {
		const expectedLogMessage = 'Successfully started listening...';
		const testAppName = 'Main app';

		describe('should return loggable with proper content', () => {
			it('in case of just a default fields presence', () => {
				const testLoggable = new AppStartLoggable({ appName: testAppName }).getLogMessage();

				expect(testLoggable).toHaveProperty('message', expectedLogMessage);
				expect(testLoggable).toHaveProperty('data', { appName: testAppName });
			});

			it('in case of both default and non-default fields presence', () => {
				const testPort = 3030;
				const testBasePath = '/api/v3';
				const testMountsDescription = '/, /api, /api/v1 --> FeathersJS, /api/v3 --> NestJS';

				const testLoggable = new AppStartLoggable({
					appName: testAppName,
					port: testPort,
					basePath: testBasePath,
					mountsDescription: testMountsDescription,
				}).getLogMessage();

				expect(testLoggable).toHaveProperty('message', expectedLogMessage);
				expect(testLoggable).toHaveProperty('data', {
					appName: testAppName,
					port: testPort,
					basePath: testBasePath,
					mountsDescription: testMountsDescription,
				});
			});
		});
	});
});
