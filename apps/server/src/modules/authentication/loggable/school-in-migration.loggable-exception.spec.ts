import { SchoolInMigrationLoggableException } from './school-in-migration.loggable-exception';

describe(SchoolInMigrationLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const exception = new SchoolInMigrationLoggableException();

			return {
				exception,
			};
		};

		it('should return the correct log message', () => {
			const { exception } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'SCHOOL_IN_MIGRATION',
				stack: expect.any(String),
			});
		});
	});
});
