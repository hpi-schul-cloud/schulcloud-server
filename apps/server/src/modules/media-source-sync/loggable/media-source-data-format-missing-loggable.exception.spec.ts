import { LogMessage } from '@core/logger';
import { MediaSourceDataFormatMissingLoggableException } from './media-source-data-format-missing-loggable.exception';

describe('MediaSourceDataFormatMissingLoggableException', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const exception = new MediaSourceDataFormatMissingLoggableException();

			return {
				exception,
			};
		};

		it('should return the correct log message', () => {
			const { exception } = setup();

			const logMessage = exception.getLogMessage();

			expect(logMessage).toEqual({
				message: `Media source data format is missing.`,
			} as LogMessage);
		});
	});
});
