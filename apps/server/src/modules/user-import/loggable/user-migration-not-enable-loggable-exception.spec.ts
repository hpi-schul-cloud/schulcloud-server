import { ObjectId } from 'mongodb';
import { UserMigrationIsNotEnabledLoggableException } from './user-migration-not-enable-loggable-exception';

describe(UserMigrationIsNotEnabledLoggableException.name, () => {
	describe('getLoggableMessage', () => {
		const setup = () => {
			const userId: string = new ObjectId().toHexString();
			const exception = new UserMigrationIsNotEnabledLoggableException(userId);

			return { exception, userId };
		};

		it('should return the correct message', () => {
			const { exception, userId } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'USER_IMPORT_MIGRATION_IS_NOT_ENABLED',
				message: 'Feature flag of user migration may be disable or the school is not an LDAP pilot',
				stack: exception.stack,
				data: {
					userId,
				},
			});
		});
	});
});
