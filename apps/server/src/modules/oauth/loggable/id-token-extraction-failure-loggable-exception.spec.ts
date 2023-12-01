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
				type: 'SSO_ID_TOKEN_EXTRACTION',
				message: 'Id Token could not be extracted from the token response',
				stack: exception.stack,
				data: {
					fieldName,
				},
			});
		});
	});
});
