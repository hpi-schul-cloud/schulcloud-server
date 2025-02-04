import { MediaSourceNotFoundLoggableException } from './media-source-not-found.loggable-exception';

describe(MediaSourceNotFoundLoggableException.name, () => {
	const setup = () => {
		const mediaSourceName = 'TestMediaSource';
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
			message: 'Unable to fetch media school licenses, because media source cannot be found.',
			data: {
				mediaSourceName,
			},
		});
	});
});
