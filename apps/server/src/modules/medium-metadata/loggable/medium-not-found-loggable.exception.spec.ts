import { MediumNotFoundLoggableException } from './medium-not-found-loggable.exception';

describe(MediumNotFoundLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const mediumId = 'mediumId';
			const sourceId = 'sourceId';
			const exception = new MediumNotFoundLoggableException(mediumId, sourceId);

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
				message: 'Medium could not be found.',
				data: {
					sourceId,
					mediumId,
				},
			});
		});
	});
});
