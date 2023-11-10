import { ObjectId } from '@mikro-orm/mongodb';
import { SchoolMigrationDatabaseOperationFailedLoggableException } from './school-migration-database-operation-failed.loggable-exception';

describe(SchoolMigrationDatabaseOperationFailedLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const schoolId = new ObjectId().toHexString();

			const exception = new SchoolMigrationDatabaseOperationFailedLoggableException(schoolId, new Error());

			return {
				exception,
				schoolId,
			};
		};

		it('should return the correct log message', () => {
			const { exception, schoolId } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'SCHOOL_LOGIN_MIGRATION_DATABASE_OPERATION_FAILED',
				stack: expect.any(String),
				data: {
					schoolId,
				},
			});
		});
	});
});
