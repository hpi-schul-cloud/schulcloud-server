import { EtherpadConfigurationMissingLoggable } from './etherpad-configuration-missing.loggable';

describe(EtherpadConfigurationMissingLoggable.name, () => {
	describe('getLogMessage', () => {
		it('should return a log message', () => {
			const loggable: EtherpadConfigurationMissingLoggable = new EtherpadConfigurationMissingLoggable();

			const logMessage = loggable.getLogMessage();

			expect(logMessage).toEqual({
				message: 'EtherpadRestClient: Missing configuration. Please check your environment variables for Etherpad',
			});
		});
	});
});
