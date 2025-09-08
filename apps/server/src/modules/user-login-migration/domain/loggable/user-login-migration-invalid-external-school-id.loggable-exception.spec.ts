import { UserLoginMigrationInvalidExternalSchoolIdLoggableException } from './user-login-migration-invalid-external-school-id.loggable-exception';

describe(UserLoginMigrationInvalidExternalSchoolIdLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const externalSchoolId = 'externalSchoolId';
			const exception = new UserLoginMigrationInvalidExternalSchoolIdLoggableException(externalSchoolId);

			return {
				exception,
				externalSchoolId,
			};
		};

		it('should return the correct log message', () => {
			const { exception, externalSchoolId } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'USER_LOGIN_MIGRATION_INVALID_EXTERNAL_SCHOOL_ID',
				message: 'The given external school ID does not match with the migrated school',
				stack: exception.stack,
				data: {
					externalSchoolId,
				},
			});
		});
	});
});
