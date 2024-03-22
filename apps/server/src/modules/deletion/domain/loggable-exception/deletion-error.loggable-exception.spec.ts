import { DeletionErrorLoggableException } from './deletion-error.loggable-exception';

describe(DeletionErrorLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const message = 'Error during deletion process';

			const exception = new DeletionErrorLoggableException(message);

			return {
				exception,
				message,
			};
		};

		it('should log the correct message', () => {
			const { exception, message } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'DELETION_ERROR',
				stack: expect.any(String),
				data: {
					errorMessage: message,
				},
			});
		});
	});
});
