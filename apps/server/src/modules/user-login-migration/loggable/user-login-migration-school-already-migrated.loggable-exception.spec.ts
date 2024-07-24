import { ObjectId } from '@mikro-orm/mongodb';
import { UserLoginMigrationSchoolAlreadyMigratedLoggableException } from './user-login-migration-school-already-migrated.loggable-exception';

describe(UserLoginMigrationSchoolAlreadyMigratedLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const schoolId = new ObjectId().toHexString();
			const exception = new UserLoginMigrationSchoolAlreadyMigratedLoggableException(schoolId);

			return {
				exception,
				schoolId,
			};
		};

		it('should return the correct log message', () => {
			const { exception, schoolId } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'USER_LOGIN_MIGRATION_SCHOOL_HAS_ALREADY_MIGRATED',
				message: 'School with externalId has already migrated',
				stack: exception.stack,
				data: {
					schoolId,
				},
			});
		});
	});
});
