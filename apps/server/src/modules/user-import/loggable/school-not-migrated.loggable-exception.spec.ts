import { SchoolNotMigratedLoggableException } from './school-not-migrated.loggable-exception';

describe(SchoolNotMigratedLoggableException, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const schoolId = 'schoolId';
			const exception = new SchoolNotMigratedLoggableException(schoolId);

			return {
				schoolId,
				exception,
			};
		};

		it('should return the correct log message', () => {
			const { schoolId, exception } = setup();

			expect(exception.getLogMessage()).toEqual({
				type: 'SCHOOL_NOT_MIGRATED',
				message: 'The school administrator started the migration for his school.',
				stack: exception.stack,
				data: {
					schoolId,
				},
			});
		});
	});
});
