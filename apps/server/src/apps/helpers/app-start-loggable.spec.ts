import { AppStartLoggable } from './app-start-loggable';

describe('AppStartLoggable', () => {
	describe('getLogMessage', () => {
		const expectedLogMessage = 'Successfully started listening...';
		const testAppName = 'Main app';

		describe('should return loggable with proper content', () => {
			it('in case of just a default fields presence', () => {
				const testInfo = { appName: testAppName };

				const testLoggable = new AppStartLoggable(testInfo).getLogMessage();

				expect(testLoggable).toHaveProperty('message', expectedLogMessage);
				expect(testLoggable).toHaveProperty('data', testInfo);
			});

			it('in case of both default and non-default fields presence', () => {
				const testInfo = {
					appName: testAppName,
					port: 3030,
					basePath: '/api/v3',
					mountsDescription: '/, /api, /api/v1 --> FeathersJS, /api/v3 --> NestJS',
				};

				const testLoggable = new AppStartLoggable(testInfo).getLogMessage();

				expect(testLoggable).toHaveProperty('message', expectedLogMessage);
				expect(testLoggable).toHaveProperty('data', testInfo);
			});
		});
	});
});
