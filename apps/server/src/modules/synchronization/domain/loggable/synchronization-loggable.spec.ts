import { ObjectId } from 'bson';
import { SynchronizationLoggable } from './synchronization-loggable';

describe(SynchronizationLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const message = 'Test message.';
			const systemId = new ObjectId().toHexString();
			const usersSynchronizedCount = 10;

			const loggable: SynchronizationLoggable = new SynchronizationLoggable(message, systemId, usersSynchronizedCount);

			return {
				loggable,
				message,
				systemId,
				usersSynchronizedCount,
			};
		};

		it('should return the correct log message', () => {
			const { loggable, message, systemId, usersSynchronizedCount } = setup();

			expect(loggable.getLogMessage()).toEqual({
				message,
				data: {
					systemId,
					usersSynchronizedCount,
				},
			});
		});
	});
});
