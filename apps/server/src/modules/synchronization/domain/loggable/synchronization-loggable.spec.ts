import { ObjectId } from 'bson';
import { SynchronizationLoggable } from './synchronization-loggable';

describe(SynchronizationLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const message = 'Test message.';
			const systemId = new ObjectId().toHexString();
			const usersSynchronizedCount = 10;

			const loggable: SynchronizationLoggable = new SynchronizationLoggable(message, systemId, usersSynchronizedCount);

			const expecteLogMessage = {
				message,
				data: {
					systemId,
					usersSynchronizedCount,
				},
			};

			return {
				expecteLogMessage,
				loggable,
				message,
				systemId,
				usersSynchronizedCount,
			};
		};

		it('should return the correct log message', () => {
			const { expecteLogMessage, loggable } = setup();

			expect(loggable.getLogMessage()).toEqual(expecteLogMessage);
		});
	});
});
