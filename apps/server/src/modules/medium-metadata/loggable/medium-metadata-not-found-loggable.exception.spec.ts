import { MediumMetadataNotFoundLoggableException } from './medium-metadata-not-found-loggable.exception';

describe(MediumMetadataNotFoundLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const mediumId = 'mediumId';
			const sourceId = 'sourceId';
			const exception = new MediumMetadataNotFoundLoggableException(mediumId, sourceId);

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
				message: 'Medium metadata could not be found.',
				data: {
					sourceId,
					mediumId,
				},
			});
		});
	});
});
