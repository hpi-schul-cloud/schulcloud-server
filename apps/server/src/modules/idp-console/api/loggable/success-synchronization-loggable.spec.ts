import { ObjectId } from 'bson';
import { SucessSynchronizationLoggable } from './sucess-synchronization-loggable';

describe(SucessSynchronizationLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const message = 'Synchronization proccess end with success';
			const systemId = new ObjectId().toHexString();
			const usersSynchronizedCount = 10;

			const loggable = new SucessSynchronizationLoggable(systemId, usersSynchronizedCount);

			const expectedLogMessage = {
				message,
				data: {
					systemId,
					usersSynchronizedCount,
				},
			};

			return {
				expectedLogMessage,
				loggable,
				message,
				systemId,
				usersSynchronizedCount,
			};
		};

		it('should return the correct log message', () => {
			const { expectedLogMessage, loggable } = setup();

			expect(loggable.getLogMessage()).toEqual(expectedLogMessage);
		});
	});
});
