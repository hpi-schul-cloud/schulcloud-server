import { ObjectId } from 'bson';
import { SynchronizationUnknownErrorLoggableException } from './synchronization-unknown-error.loggable-exception';

describe(SynchronizationUnknownErrorLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const message =
				'Unknown error occurred during synchronization process of users provisioned by an external system';
			const systemId = new ObjectId().toHexString();

			const exception = new SynchronizationUnknownErrorLoggableException(systemId);

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
