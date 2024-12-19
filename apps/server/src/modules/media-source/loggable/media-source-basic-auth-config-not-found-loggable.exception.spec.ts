import { mediaSourceFactory } from '@modules/media-source/testing';
import { MediaSourceBasicAuthConfigNotFoundLoggableException } from './media-source-basic-auth-config-not-found-loggable.exception';

describe(MediaSourceBasicAuthConfigNotFoundLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const mediaSource = mediaSourceFactory.build();
			const exception = new MediaSourceBasicAuthConfigNotFoundLoggableException(
				mediaSource.id,
				mediaSource.name as string
			);

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
				message: `Required basic auth config of media source ${mediaSourceName} is missing.`,
				data: {
					mediaSourceId: mediaSource.id,
					mediaSourceName,
				},
			});
		});
	});
});
