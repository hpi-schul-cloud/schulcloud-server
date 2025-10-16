import { MediumBadRequestLoggableException } from './medium-bad-request-loggable.exception';

describe(MediumBadRequestLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const mediumId = 'mediumId';
			const sourceId = 'sourceId';
			const exception = new MediumBadRequestLoggableException(mediumId, sourceId);

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
				message: `Media provider responded with bad request response.`,
				data: {
					sourceId,
					mediumId,
				},
			});
		});
	});
});
