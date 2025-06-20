import { AxiosError } from 'axios';
import { DeletionErrorLoggableException } from './deletion-error.loggable-exception';

describe(DeletionErrorLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = (axiosError = false) => {
			const message = 'Error during deletion process';
			let error: Error | AxiosError | undefined;
			if (axiosError) {
				error = new AxiosError(message);
			} else {
				error = new Error(message);
			}

			return {
				message,
				error,
			};
		};

		it('should log the correct message for AxiosError', () => {
			const { message, error } = setup(true);

			const exception = new DeletionErrorLoggableException(message, error);
			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'DELETION_ERROR',
				stack: expect.any(String),
				data: {
					errorMessage: message,
				},
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				error: expect.objectContaining({
					name: 'AxiosErrorLoggable',
					status: 500,
					type: 'DELETION_3RD_PARTY_ERROR',
				} as Partial<AxiosError>),
			});
		});

		it('should log the correct message', () => {
			const { message, error } = setup();

			const exception = new DeletionErrorLoggableException(message, error);
			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'DELETION_ERROR',
				stack: expect.any(String),
				data: {
					errorMessage: message,
				},
				error,
			});
		});
	});
});
