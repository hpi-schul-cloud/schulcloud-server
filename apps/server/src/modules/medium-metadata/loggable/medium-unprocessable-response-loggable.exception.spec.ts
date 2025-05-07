import { MediumUnprocessableResponseLoggableException } from './medium-unprocessable-response-loggable.exception';

describe(MediumUnprocessableResponseLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const mediumId = 'mediumId';
			const sourceId = 'sourceId';
			const exception = new MediumUnprocessableResponseLoggableException(mediumId, sourceId);

			return {
				exception,
				sourceId,
				mediumId,
			};
		};

		it('should return the correct log message', () => {
			const { exception, sourceId, mediumId } = setup();

			const logMessage = exception.getLogMessage();

			expect(logMessage).toEqual({
				message: `Media provider responded with unprocessable response.`,
				data: {
					sourceId,
					mediumId,
				},
			});
		});
	});
});
