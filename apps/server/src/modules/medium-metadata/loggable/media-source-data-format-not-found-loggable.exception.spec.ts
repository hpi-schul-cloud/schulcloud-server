import { LogMessage } from '@core/logger';
import { MediaSourceDataFormatNotFoundLoggableException } from './media-source-data-format-not-found-loggable.exception';

describe(MediaSourceDataFormatNotFoundLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const exception = new MediaSourceDataFormatNotFoundLoggableException();

			return {
				exception,
			};
		};

		it('should return the correct log message', () => {
			const { exception } = setup();

			const logMessage = exception.getLogMessage();

			expect(logMessage).toEqual<LogMessage>({
				message: `Media source data format is missing.`,
			});
		});
	});
});
