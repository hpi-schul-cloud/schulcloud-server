import { UserLoginMigrationAlreadyClosedLoggableException } from '@modules/user-login-migration/loggable/user-login-migration-already-closed.loggable-exception';
import { ObjectId } from '@mikro-orm/mongodb';

describe(UserLoginMigrationAlreadyClosedLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const closedAt = new Date();

			const userLoginMigrationId = new ObjectId().toHexString();

			const exception = new UserLoginMigrationAlreadyClosedLoggableException(closedAt, userLoginMigrationId);

			return {
				closedAt,
				userLoginMigrationId,
				exception,
			};
		};

		it('should return the correct log message', () => {
			const { closedAt, userLoginMigrationId, exception } = setup();

			const logMessage = exception.getLogMessage();

			expect(logMessage).toEqual({
				type: 'USER_LOGIN_MIGRATION_ALREADY_CLOSED',
				message: 'Migration of school cannot be started or changed, because it is already closed.',
				stack: expect.any(String),
				data: {
					userLoginMigrationId,
					closedAt: closedAt.toISOString(),
				},
			});
		});
	});
});
