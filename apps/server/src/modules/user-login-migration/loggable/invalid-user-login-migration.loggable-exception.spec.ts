import { ObjectId } from '@mikro-orm/mongodb';
import { InvalidUserLoginMigrationLoggableException } from './invalid-user-login-migration.loggable-exception';

describe(InvalidUserLoginMigrationLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const userId = new ObjectId().toHexString();
			const targetSystemId = new ObjectId().toHexString();

			const exception = new InvalidUserLoginMigrationLoggableException(userId, targetSystemId);

			return {
				exception,
				userId,
				targetSystemId,
			};
		};

		it('should return the correct log message', () => {
			const { exception, userId, targetSystemId } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'INVALID_USER_LOGIN_MIGRATION',
				message: 'The migration cannot be started, because there is no migration to the selected target system.',
				stack: expect.any(String),
				data: {
					userId,
					targetSystemId,
				},
			});
		});
	});
});
