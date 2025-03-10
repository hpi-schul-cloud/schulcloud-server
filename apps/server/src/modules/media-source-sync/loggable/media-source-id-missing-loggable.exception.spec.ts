import { LogMessage } from '@core/logger';
import { MediaSourceIdMissingLoggableException } from './media-source-id-missing-loggable.exception';

describe('MediaSourceIdMissingLoggableException', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const exception = new MediaSourceIdMissingLoggableException();

			return {
				exception,
			};
		};

		it('should return the correct log message', () => {
			const { exception } = setup();

			const logMessage = exception.getLogMessage();

			expect(logMessage).toEqual({
				message: `Media source id is missing.`,
			} as LogMessage);
		});
	});
});
