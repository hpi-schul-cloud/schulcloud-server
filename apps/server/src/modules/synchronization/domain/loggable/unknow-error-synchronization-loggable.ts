import { ObjectId } from 'bson';
import { UnknowErrorSynchronizationLoggable } from './uknown-error-synchronization-loggable';

describe(UnknowErrorSynchronizationLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const message = 'Unknonw error during synchronisation process for users provisioned by system';
			const systemId = new ObjectId().toHexString();

			const loggable = new UnknowErrorSynchronizationLoggable(systemId);

			const expectedLogMessage = {
				message,
				data: {
					systemId,
				},
			};

			return {
				expectedLogMessage,
				loggable,
				message,
				systemId,
			};
		};

		it('should return the correct log message', () => {
			const { expectedLogMessage, loggable } = setup();

			expect(loggable.getLogMessage()).toEqual(expectedLogMessage);
		});
	});
});
