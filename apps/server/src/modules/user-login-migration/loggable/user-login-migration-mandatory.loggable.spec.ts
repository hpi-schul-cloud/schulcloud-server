import { ObjectId } from '@mikro-orm/mongodb';
import { UserLoginMigrationMandatoryLoggable } from './user-login-migration-mandatory.loggable';

describe(UserLoginMigrationMandatoryLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const userId = new ObjectId().toHexString();
			const userLoginMigrationId = new ObjectId().toHexString();
			const exception = new UserLoginMigrationMandatoryLoggable(userId, userLoginMigrationId, true);

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
				message: 'The school administrator changed the requirement status of the user login migration for his school.',
				data: {
					userId,
					userLoginMigrationId,
					mandatory: true,
				},
			});
		});
	});
});
