import { SynchronizationErrorLoggableException } from './synchronization-error.loggable-exception';

describe(SynchronizationErrorLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const message = 'Error during synchronization process';

			const exception = new SynchronizationErrorLoggableException(message);

			return {
				exception,
				message,
			};
		};

		it('should log the correct message', () => {
			const { exception, message } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'SYNCHRONIZATION_ERROR',
				stack: expect.any(String),
				data: {
					errorMessage: message,
				},
			});
		});
	});
});
