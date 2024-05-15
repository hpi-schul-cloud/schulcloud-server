import { ObjectId } from '@mikro-orm/mongodb';
import { userLoginMigrationDOFactory } from '@shared/testing/factory';
import { UserMigrationSuccessfulLoggable } from './user-migration-successful.loggable';

describe(UserMigrationSuccessfulLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const userId = new ObjectId().toHexString();
			const userLoginMigration = userLoginMigrationDOFactory.buildWithId();

			const exception = new UserMigrationSuccessfulLoggable(userId, userLoginMigration);

			return {
				exception,
				userId,
				userLoginMigration,
			};
		};

		it('should return the correct log message', () => {
			const { exception, userId, userLoginMigration } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				message: 'A user has successfully migrated.',
				data: {
					userId,
					userLoginMigrationId: userLoginMigration.id,
				},
			});
		});
	});
});
