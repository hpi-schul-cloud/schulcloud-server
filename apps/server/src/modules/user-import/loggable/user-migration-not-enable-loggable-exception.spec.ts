import { ObjectId } from 'mongodb';
import { UserMigrationIsNotEnabledLoggableException } from './user-migration-not-enable-loggable-exception';

describe(UserMigrationIsNotEnabledLoggableException.name, () => {
	describe('getLoggableMessage', () => {
		const setup = () => {
			const userId: string = new ObjectId().toHexString();
			const schoolId: string = new ObjectId().toHexString();
			const exception = new UserMigrationIsNotEnabledLoggableException(userId, schoolId);

			return { exception, userId, schoolId };
		};

		it('should return the correct message', () => {
			const { exception, userId, schoolId } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'USER_IMPORT_MIGRATION_IS_NOT_ENABLED',
				message: 'Feature flag of user migration may be disable or the school is not an LDAP pilot',
				stack: exception.stack,
				data: {
					userId,
					schoolId,
				},
			});
		});
	});
});
