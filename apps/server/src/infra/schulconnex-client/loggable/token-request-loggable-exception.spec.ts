import { axiosErrorFactory } from '@shared/testing/factory';
import { AxiosError } from 'axios';
import { TokenRequestLoggableException } from './token-request-loggable-exception';

describe(TokenRequestLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const error = {
				error: 'invalid_request',
			};
			const axiosError: AxiosError = axiosErrorFactory.withError(error).build();
			const exception = new TokenRequestLoggableException(axiosError);

			return {
				axiosError,
				exception,
				error,
			};
		};

		it('should return the correct log message', () => {
			const { axiosError, exception, error } = setup();

			const logMessage = exception.getLogMessage();

			expect(logMessage).toStrictEqual({
				type: 'OAUTH_TOKEN_REQUEST_ERROR',
				message: axiosError.message,
				data: JSON.stringify(error),
				stack: axiosError.stack,
			});
		});
	});
});
