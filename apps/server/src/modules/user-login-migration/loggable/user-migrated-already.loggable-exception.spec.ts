import { ObjectId } from '@mikro-orm/mongodb';
import { MultipleUsersFoundInMigrationLoggableException } from './user-migrated-already.loggable-exception';

describe(MultipleUsersFoundInMigrationLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const externalUserId = new ObjectId().toHexString();
			const exception = new MultipleUsersFoundInMigrationLoggableException(externalUserId);

			return {
				exception,
				externalUserId,
			};
		};

		it('should return the correct log message', () => {
			const { exception, externalUserId } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'USER_LOGIN_MIGRATION_USER_HAS_ALREADY_MIGRATED',
				message: 'User with externalId has already migrated',
				stack: expect.any(String),
				data: {
					externalUserId,
				},
			});
		});
	});
});
