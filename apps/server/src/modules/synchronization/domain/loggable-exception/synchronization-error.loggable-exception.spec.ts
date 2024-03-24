import { ObjectId } from 'bson';
import { SynchronizationErrorLoggableException } from './synchronization-error.loggable-exception';

describe(SynchronizationErrorLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const message = 'Error during synchronization process';
			const systemId = new ObjectId().toHexString();

			const exception = new SynchronizationErrorLoggableException(message, systemId);

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
