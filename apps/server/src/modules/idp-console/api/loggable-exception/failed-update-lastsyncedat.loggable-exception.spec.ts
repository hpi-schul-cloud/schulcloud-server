import { ObjectId } from 'bson';
import { FailedUpdateLastSyncedAtLoggableException } from './failed-update-lastsyncedat.loggable-exception';

describe(FailedUpdateLastSyncedAtLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const message = 'Failed to update lastSyncedAt field for users provisioned by system';
			const systemId = new ObjectId().toHexString();

			const exception = new FailedUpdateLastSyncedAtLoggableException(systemId);

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
