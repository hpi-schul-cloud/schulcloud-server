import { SchulconnexConfigurationMissingLoggable } from './schulconnex-configuration-missing.loggable';

describe(SchulconnexConfigurationMissingLoggable.name, () => {
	describe('getLogMessage', () => {
		it('should return a log message', () => {
			const loggable: SchulconnexConfigurationMissingLoggable = new SchulconnexConfigurationMissingLoggable();

			const logMessage = loggable.getLogMessage();

			expect(logMessage).toEqual({
				message:
					'SchulconnexRestClient: Missing configuration. Please check your environment variables in SCHULCONNEX_CLIENT.',
			});
		});
	});
});
