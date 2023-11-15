import { ObjectId } from '@mikro-orm/mongodb';
import { userLoginMigrationDOFactory } from '@shared/testing';
import { UserMigrationStartedLoggable } from './user-migration-started.loggable';

describe(UserMigrationStartedLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const userId = new ObjectId().toHexString();
			const userLoginMigration = userLoginMigrationDOFactory.buildWithId();

			const exception = new UserMigrationStartedLoggable(userId, userLoginMigration);

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
				message: 'A user started the user login migration.',
				data: {
					userId,
					userLoginMigrationId: userLoginMigration.id,
				},
			});
		});
	});
});
