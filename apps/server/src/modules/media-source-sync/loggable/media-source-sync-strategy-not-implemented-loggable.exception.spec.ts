import { MediaSourceDataFormat } from '../../media-source/enum';
import { MediaSourceSyncStrategyNotImplementedLoggableException } from './media-source-sync-strategy-not-implemented-loggable.exception';

describe(MediaSourceSyncStrategyNotImplementedLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const mediaSourceDataFormat = MediaSourceDataFormat.BILDUNGSLOGIN;
			const exception = new MediaSourceSyncStrategyNotImplementedLoggableException(mediaSourceDataFormat);

			return {
				exception,
				mediaSourceDataFormat,
			};
		};

		it('should return the correct log message', () => {
			const { exception, mediaSourceDataFormat } = setup();

			const logMessage = exception.getLogMessage();

			expect(logMessage).toEqual({
				message: `The sync strategy for media source data format ${mediaSourceDataFormat} is not implemented or not registered.`,
				data: {
					mediaSourceDataFormat,
				},
			});
		});
	});
});
