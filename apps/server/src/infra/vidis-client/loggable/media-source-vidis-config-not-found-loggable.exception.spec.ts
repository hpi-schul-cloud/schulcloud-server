import { vidisMediaSourceFactory } from '../testing';
import { MediaSourceVidisConfigNotFoundLoggableException } from './media-source-vidis-config-not-found-loggable.exception';

describe(MediaSourceVidisConfigNotFoundLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const mediaSource = vidisMediaSourceFactory.build();
			const mediaSourceName = 'Test Media Source';
			const exception = new MediaSourceVidisConfigNotFoundLoggableException(mediaSource.id, mediaSourceName);

			return {
				mediaSource,
				mediaSourceName,
				exception,
			};
		};

		it('should return the correct log message', () => {
			const { mediaSource, mediaSourceName, exception } = setup();

			const logMessage = exception.getLogMessage();

			expect(logMessage).toEqual({
				message: `Required vidis config of media source ${mediaSourceName} is missing.`,
				data: {
					mediaSourceId: mediaSource.id,
					mediaSourceName,
				},
			});
		});
	});
});
