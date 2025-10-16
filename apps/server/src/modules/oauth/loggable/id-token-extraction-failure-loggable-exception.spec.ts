import { IdTokenExtractionFailureLoggableException } from './id-token-extraction-failure-loggable-exception';

describe(IdTokenExtractionFailureLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const fieldName = 'id_token';
			const details = { detail: 'additional info' };

			const exception = new IdTokenExtractionFailureLoggableException(fieldName, details);

			return { exception, fieldName, details };
		};

		it('should return a LogMessage', () => {
			const { exception, fieldName, details } = setup();

			const logMessage = exception.getLogMessage();

			expect(logMessage).toEqual({
				type: 'ID_TOKEN_EXTRACTION_FAILURE',
				message: 'Failed to extract field',
				stack: exception.stack,
				data: {
					fieldName,
					...details,
				},
			});
		});
	});
});
