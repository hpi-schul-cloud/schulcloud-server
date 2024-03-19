import { IdTokenExtractionFailureLoggableException } from './id-token-extraction-failure-loggable-exception';

describe(IdTokenExtractionFailureLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const fieldName = 'id_token';

			const exception = new IdTokenExtractionFailureLoggableException(fieldName);

			return { exception, fieldName };
		};

		it('should return a LogMessage', () => {
			const { exception, fieldName } = setup();

			const logMessage = exception.getLogMessage();

			expect(logMessage).toEqual({
				type: 'ID_TOKEN_EXTRACTION_FAILURE',
				message: 'Failed to extract field',
				stack: exception.stack,
				data: {
					fieldName,
				},
			});
		});
	});
});
