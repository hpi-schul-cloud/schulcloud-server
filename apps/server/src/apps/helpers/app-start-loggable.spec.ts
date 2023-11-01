import { AppStartLoggable } from './app-start-loggable';

describe('AppStartLoggable', () => {
	describe('getLogMessage', () => {
		const expectedMessage = 'Successfully started listening...';
		const testAppName = 'Main app';

		describe('should return a log message with proper content', () => {
			it('in case of just a default fields presence', () => {
				const testInfo = { appName: testAppName };

				const testLogMessage = new AppStartLoggable(testInfo).getLogMessage();

				expect(testLogMessage).toHaveProperty('message', expectedMessage);
				expect(testLogMessage).toHaveProperty('data', testInfo);
			});

			it('in case of both default and non-default fields presence', () => {
				const testInfo = {
					appName: testAppName,
					port: 3030,
					basePath: '/api/v3',
					mountsDescription: '/, /api, /api/v1 --> FeathersJS, /api/v3 --> NestJS',
				};

				const testLogMessage = new AppStartLoggable(testInfo).getLogMessage();

				expect(testLogMessage).toHaveProperty('message', expectedMessage);
				expect(testLogMessage).toHaveProperty('data', testInfo);
			});
		});
	});
});
