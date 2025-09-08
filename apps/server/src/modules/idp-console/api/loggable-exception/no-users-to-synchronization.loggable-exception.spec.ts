import { ObjectId } from 'bson';
import { NoUsersToSynchronizationLoggableException } from './no-users-to-synchronization.loggable-exception';

describe(NoUsersToSynchronizationLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const message = 'No users to check from system';
			const systemId = new ObjectId().toHexString();

			const exception = new NoUsersToSynchronizationLoggableException(systemId);

			const expectedErrorLogMessage = {
				type: 'SYNCHRONIZATION_ERROR',
				stack: expect.any(String),
				data: {
					systemId,
					errorMessage: message,
				},
			};

			return {
				exception,
				expectedErrorLogMessage,
			};
		};

		it('should log the correct message', () => {
			const { exception, expectedErrorLogMessage } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual(expectedErrorLogMessage);
		});
	});
});
