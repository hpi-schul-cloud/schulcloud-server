import { ObjectId } from '@mikro-orm/mongodb';
import { MultipleUsersFoundLoggableException } from './multiple-users-found.loggable-exception';

describe(MultipleUsersFoundLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const externalUserId = new ObjectId().toHexString();

			const exception = new MultipleUsersFoundLoggableException(externalUserId);

			return {
				exception,
				externalUserId,
			};
		};

		it('should return a LogMessage', () => {
			const { exception, externalUserId } = setup();

			const logMessage = exception.getLogMessage();

			expect(logMessage).toEqual({
				type: 'MULTIPLE_USERS_FOUND',
				message: 'Multiple users found with this externalId',
				stack: exception.stack,
				data: {
					externalUserId,
				},
			});
		});
	});
});
