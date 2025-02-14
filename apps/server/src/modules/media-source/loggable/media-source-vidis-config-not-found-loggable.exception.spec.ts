import { mediaSourceFactory } from '@modules/media-source/testing';
import { MediaSourceVidisConfigNotFoundLoggableException } from './media-source-vidis-config-not-found-loggable.exception';

describe(MediaSourceVidisConfigNotFoundLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const mediaSource = mediaSourceFactory.build();
			const exception = new MediaSourceVidisConfigNotFoundLoggableException(mediaSource.id, mediaSource.name as string);

			return {
				mediaSource,
				exception,
			};
		};

		it('should return the correct log message', () => {
			const { mediaSource, exception } = setup();

			const logMessage = exception.getLogMessage();

			const mediaSourceName = mediaSource.name as string;
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
