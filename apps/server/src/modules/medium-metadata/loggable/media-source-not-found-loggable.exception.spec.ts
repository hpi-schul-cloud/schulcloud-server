import { MediaSourceNotFoundLoggableException } from './media-source-not-found-loggable.exception';

describe(MediaSourceNotFoundLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const mediaSourceName = 'test-media-source';
			const exception = new MediaSourceNotFoundLoggableException(mediaSourceName);

			return {
				exception,
				mediaSourceName,
			};
		};

		it('should return the correct log message', () => {
			const { exception, mediaSourceName } = setup();

			const logMessage = exception.getLogMessage();

			expect(logMessage).toEqual({
				message: 'Media source could not be found.',
				data: {
					mediaSourceName,
				},
			});
		});
	});
});
