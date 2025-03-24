import { ObjectId } from '@mikro-orm/mongodb';
import { UserNotMigratedLoggableException } from './user-not-migrated.loggable-exception';

describe(UserNotMigratedLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const userId = new ObjectId().toHexString();

			const exception = new UserNotMigratedLoggableException(userId);

			return {
				exception,
				userId,
			};
		};

		it('should return the correct log message', () => {
			const { exception, userId } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'USER_NOT_MIGRATED',
				message: 'The user has not migrated yet.',
				stack: expect.any(String),
				data: {
					userId,
				},
			});
		});
	});
});
