import { legacySchoolDoFactory } from '@shared/testing/factory';
import { SchoolMigrationDatabaseOperationFailedLoggableException } from './school-migration-database-operation-failed.loggable-exception';

describe(SchoolMigrationDatabaseOperationFailedLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const school = legacySchoolDoFactory.buildWithId();

			const exception = new SchoolMigrationDatabaseOperationFailedLoggableException(school, 'migration', new Error());

			return {
				exception,
				school,
			};
		};

		it('should return the correct log message', () => {
			const { exception, school } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'SCHOOL_LOGIN_MIGRATION_DATABASE_OPERATION_FAILED',
				stack: expect.any(String),
				data: {
					schoolId: school.id,
					operation: 'migration',
				},
			});
		});
	});
});
