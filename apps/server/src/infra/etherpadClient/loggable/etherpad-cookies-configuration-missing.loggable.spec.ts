import { EtherpadConfigurationMissingLoggable } from './etherpad-configuration-missing.loggable';
import {
	EtherpadCookiesConfigurationMissingLoggable,
	MissingCookie,
} from './etherpad-cookies-configuration-missing.loggable';

describe(EtherpadCookiesConfigurationMissingLoggable.name, () => {
	describe('getLogMessage', () => {
		describe('when cookie expiration missing', () => {
			it('should return a log message', () => {
				const cookieValue = 888;
				const loggable: EtherpadConfigurationMissingLoggable = new EtherpadCookiesConfigurationMissingLoggable(
					cookieValue,
					MissingCookie.cookieExpiration
				);

				const logMessage = loggable.getLogMessage();

				expect(logMessage).toEqual({
					message:
						'EtherpadRestClient: Missing cookies expiration configuration. Setting cookie expiration to default value 888',
				});
			});
		});

		describe('when cookie release threshold missing', () => {
			it('should return a log message', () => {
				const cookieValue = 888;
				const loggable: EtherpadConfigurationMissingLoggable = new EtherpadCookiesConfigurationMissingLoggable(
					cookieValue,
					MissingCookie.cookieReleaseThreshold
				);

				const logMessage = loggable.getLogMessage();

				expect(logMessage).toEqual({
					message:
						'EtherpadRestClient: Missing cookies release threshold configuration. Setting cookie release threshold to default value 888',
				});
			});
		});
	});
});
