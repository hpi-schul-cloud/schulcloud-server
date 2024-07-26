import { ObjectId } from '@mikro-orm/mongodb';
import { UserLoginMigrationInvalidAdminLoggableException } from './user-login-migration-invalid-admin.loggable-exception';

describe(UserLoginMigrationInvalidAdminLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const userId = new ObjectId().toHexString();
			const exception = new UserLoginMigrationInvalidAdminLoggableException(userId);

			return {
				exception,
				userId,
			};
		};

		it('should return the correct log message', () => {
			const { exception, userId } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'USER_LOGIN_MIGRATION_INVALID_ADMIN',
				message: 'The user is not an administrator',
				stack: exception.stack,
				data: {
					userId,
				},
			});
		});
	});
});
