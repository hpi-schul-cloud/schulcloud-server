import { UserLoginMigrationMultipleEmailUsersLoggableException } from './user-login-migration-multiple-email-users.loggable-exception';

describe(UserLoginMigrationMultipleEmailUsersLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const email = 'test@test.de';
			const exception = new UserLoginMigrationMultipleEmailUsersLoggableException(email);

			return {
				exception,
				email,
			};
		};

		it('should return the correct log message', () => {
			const { exception, email } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'USER_LOGIN_MIGRATION_MULTIPLE_EMAIL_USERS',
				message: 'There is multiple users with this email',
				stack: exception.stack,
				data: {
					email,
				},
			});
		});
	});
});
