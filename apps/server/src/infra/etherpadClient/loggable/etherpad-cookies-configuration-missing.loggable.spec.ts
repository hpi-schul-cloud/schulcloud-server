import { MissingCookie } from '../interface';
import { EtherpadConfigurationMissingLoggable } from './etherpad-configuration-missing.loggable';
import { EtherpadCookiesConfigurationMissingLoggable } from './etherpad-cookies-configuration-missing.loggable';

describe(EtherpadCookiesConfigurationMissingLoggable.name, () => {
	describe('getLogMessage', () => {
		describe('when cookie expiration missing', () => {
			const setup = () => {
				const cookieValue = 888;
				const loggable: EtherpadConfigurationMissingLoggable = new EtherpadCookiesConfigurationMissingLoggable(
					cookieValue,
					MissingCookie.COOKIE_EXPIRATION
				);
				return {
					loggable,
				};
			};
			it('should return a log message', () => {
				const { loggable } = setup();
				const logMessage = loggable.getLogMessage();

				expect(logMessage).toEqual({
					message:
						'EtherpadRestClient: Missing cookies expiration configuration. Setting cookie expiration to default value 888',
				});
			});
		});

		describe('when cookie release threshold missing', () => {
			const setup = () => {
				const cookieValue = 888;
				const loggable: EtherpadConfigurationMissingLoggable = new EtherpadCookiesConfigurationMissingLoggable(
					cookieValue,
					MissingCookie.COOKIE_RELEASE_THRESHOLD
				);
				return {
					loggable,
				};
			};
			it('should return a log message', () => {
				const { loggable } = setup();
				const logMessage = loggable.getLogMessage();

				expect(logMessage).toEqual({
					message:
						'EtherpadRestClient: Missing cookies release threshold configuration. Setting cookie release threshold to default value 888',
				});
			});
		});
	});
});
