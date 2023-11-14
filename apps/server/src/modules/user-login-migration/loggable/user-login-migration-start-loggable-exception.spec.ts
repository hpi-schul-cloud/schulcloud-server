import { ObjectId } from 'bson';
import { UserLoginMigrationStartLoggableException } from './user-login-migration-start-loggable-exception';

describe(UserLoginMigrationStartLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const userId = new ObjectId().toHexString();
			const userLoginMigrationId = new ObjectId().toHexString();
			const exception = new UserLoginMigrationStartLoggableException(userId, userLoginMigrationId);

			return {
				exception,
				userId,
				userLoginMigrationId,
			};
		};

		it('should return the correct log message', () => {
			const { exception, userId, userLoginMigrationId } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				message: 'The school administrator started the migration for his school.',
				data: {
					userId,
					userLoginMigrationId,
				},
			});
		});
	});
});
