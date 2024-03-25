import { ObjectId } from 'bson';
import { FailedUpdateLastSyncedAtLoggable } from './failed-update-lastsyncedat-loggable';

describe(FailedUpdateLastSyncedAtLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const message = 'Failed to update lastSyncedAt field for users provisioned by system';
			const systemId = new ObjectId().toHexString();

			const loggable = new FailedUpdateLastSyncedAtLoggable(systemId);

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
