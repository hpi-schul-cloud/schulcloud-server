import { ObjectId } from '@mikro-orm/mongodb';
import { OauthConfigMissingLoggableException } from './oauth-config-missing-loggable-exception';

describe(OauthConfigMissingLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const systemId = new ObjectId().toHexString();

			const exception = new OauthConfigMissingLoggableException(systemId);

			return {
				exception,
				systemId,
			};
		};

		it('should return a LogMessage', () => {
			const { exception, systemId } = setup();

			const logMessage = exception.getLogMessage();

			expect(logMessage).toEqual({
				type: 'OAUTH_CONFIG_MISSING',
				message: 'Requested system has no oauth configured',
				stack: exception.stack,
				data: {
					systemId,
				},
			});
		});
	});
});
