import { ObjectId } from 'bson';
import { StartSynchronizationLoggable } from './start-synchronization-loggable';

describe(StartSynchronizationLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const message = 'Start synchronization users from systemId';
			const systemId = new ObjectId().toHexString();

			const loggable = new StartSynchronizationLoggable(systemId);

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
