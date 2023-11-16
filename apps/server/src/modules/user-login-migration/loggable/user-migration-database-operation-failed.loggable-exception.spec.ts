import { ObjectId } from '@mikro-orm/mongodb';
import { UserMigrationDatabaseOperationFailedLoggableException } from './user-migration-database-operation-failed.loggable-exception';

describe(UserMigrationDatabaseOperationFailedLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const userId = new ObjectId().toHexString();

			const exception = new UserMigrationDatabaseOperationFailedLoggableException(userId, 'migration', new Error());

			return {
				exception,
				userId,
			};
		};

		it('should return the correct log message', () => {
			const { exception, userId } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'USER_LOGIN_MIGRATION_DATABASE_OPERATION_FAILED',
				stack: expect.any(String),
				data: {
					userId,
					operation: 'migration',
				},
			});
		});
	});
});
