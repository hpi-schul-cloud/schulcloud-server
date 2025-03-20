import { LogMessage } from '@core/logger';
import { ValidationErrorLoggableException } from './validation-error-loggable.exception';

describe(ValidationErrorLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const mediumId = 'mediumId';
			const mediaSourceId = 'mediaSourceId';
			const exception = new ValidationErrorLoggableException(mediumId, mediaSourceId);

			return {
				exception,
				mediumId,
				mediaSourceId,
			};
		};

		it('should return the correct log message', () => {
			const { exception, mediumId, mediaSourceId } = setup();

			const logMessage = exception.getLogMessage();

			expect(logMessage).toEqual({
				message: `Metadata Synchronization for mediumId: ${mediumId} and mediaSourceId: ${mediaSourceId} failed.`,
				data: {
					mediumId,
					mediaSourceId,
				},
			} as LogMessage);
		});
	});
});
