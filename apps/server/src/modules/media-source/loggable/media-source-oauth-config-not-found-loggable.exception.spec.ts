import { mediaSourceFactory } from '@modules/media-source/testing';
import { MediaSourceOauthConfigNotFoundLoggableException } from './media-source-oauth-config-not-found-loggable.exception';

describe(MediaSourceOauthConfigNotFoundLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const mediaSource = mediaSourceFactory.build();
			const exception = new MediaSourceOauthConfigNotFoundLoggableException(mediaSource.id, mediaSource.name as string);

			return {
				exception,
				mediaSource,
			};
		};

		it('should return the correct log message', () => {
			const { exception, mediaSource } = setup();

			const logMessage = exception.getLogMessage();

			const mediaSourceName = mediaSource.name as string;
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
