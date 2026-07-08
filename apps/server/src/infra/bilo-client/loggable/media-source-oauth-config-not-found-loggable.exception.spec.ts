import { biloMediaSourceFactory } from '../testing';
import { MediaSourceOauthConfigNotFoundLoggableException } from './media-source-oauth-config-not-found-loggable.exception';

describe(MediaSourceOauthConfigNotFoundLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const mediaSource = biloMediaSourceFactory.build();
			const mediaSourceName = 'Test Media Source';
			const exception = new MediaSourceOauthConfigNotFoundLoggableException(mediaSource.id, mediaSourceName);

			return {
				exception,
				mediaSource,
				mediaSourceName,
			};
		};

		it('should return the correct log message', () => {
			const { exception, mediaSource, mediaSourceName } = setup();

			const logMessage = exception.getLogMessage();

			expect(logMessage).toEqual({
				message: `Required oauth config of media source ${mediaSourceName} is missing.`,
				data: {
					mediaSourceId: mediaSource.id,
					mediaSourceName,
				},
			});
		});
	});
});
