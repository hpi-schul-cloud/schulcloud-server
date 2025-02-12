import { LogMessage } from '@core/logger';
import { MediaSourceDataFormat } from '@modules/media-source';
import { SyncStrategyNotImplementedLoggableException } from './sync-strategy-not-implemented-loggable.exception';

describe(SyncStrategyNotImplementedLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const mediaSourceDataFormat = MediaSourceDataFormat.BILDUNGSLOGIN;
			const exception = new SyncStrategyNotImplementedLoggableException(mediaSourceDataFormat);

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
			} as LogMessage);
		});
	});
});
