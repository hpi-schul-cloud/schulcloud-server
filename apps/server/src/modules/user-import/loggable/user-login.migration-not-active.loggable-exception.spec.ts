import { UserLoginMigrationNotActiveLoggableException } from '@modules/user-import/loggable/user-login-migration-not-active.loggable-exception';

describe(UserLoginMigrationNotActiveLoggableException, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const schoolId = 'schoolId';
			const exception = new UserLoginMigrationNotActiveLoggableException(schoolId);

			return {
				schoolId,
				exception,
			};
		};

		it('should return the correct log message', () => {
			const { schoolId, exception } = setup();

			expect(exception.getLogMessage()).toEqual({
				type: 'USER_LOGIN_MIGRATION_NOT_ACTIVE',
				message:
					'The user login migration for this school is not active. It is either not started yet or already closed',
				stack: exception.stack,
				data: {
					schoolId,
				},
			});
		});
	});
});
