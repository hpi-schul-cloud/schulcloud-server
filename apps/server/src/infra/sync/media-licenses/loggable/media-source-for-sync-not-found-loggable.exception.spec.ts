import { MediaSourceForSyncNotFoundLoggableException } from './media-source-for-sync-not-found-loggable.exception';

describe(MediaSourceForSyncNotFoundLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const mediaSourceName = 'test-media-source';
			const exception = new MediaSourceForSyncNotFoundLoggableException(mediaSourceName);

			return {
				exception,
				mediaSourceName,
			};
		};

		it('should return the correct log message', () => {
			const { exception, mediaSourceName } = setup();

			const logMessage = exception.getLogMessage();

			expect(logMessage).toEqual({
				message: 'Unable to sync media school license, because media source cannot be found.',
				data: {
					mediaSourceName,
				},
			});
		});
	});
});
