import { ObjectId } from 'bson';
import { NoUsersToSynchronizationLoggable } from './no-users-to-synchronization-loggable';

describe(NoUsersToSynchronizationLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const message = 'No users to check from system';
			const systemId = new ObjectId().toHexString();

			const loggable = new NoUsersToSynchronizationLoggable(systemId);

			const expectedLogMessage = {
				message,
				data: {
					systemId,
				},
			};

			return {
				expectedLogMessage,
				loggable,
				systemId,
			};
		};

		it('should return the correct log message', () => {
			const { expectedLogMessage, loggable } = setup();

			expect(loggable.getLogMessage()).toEqual(expectedLogMessage);
		});
	});
});
