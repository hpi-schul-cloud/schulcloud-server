import { axiosErrorFactory } from '@testing/factory/axios-error.factory';
import { AxiosError } from 'axios';
import { HydraOauthFailedLoggableException } from './hydra-oauth-failed-loggable-exception';

describe(HydraOauthFailedLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const error = {
				error: 'invalid_request',
			};
			const axiosError: AxiosError = axiosErrorFactory.withError(error).build({ stack: 'someStack' });

			const exception = new HydraOauthFailedLoggableException(axiosError);

			return {
				exception,
				axiosError,
				error,
			};
		};

		it('should return the correct log message', () => {
			const { exception, axiosError, error } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'HYDRA_OAUTH_FAILED',
				message: 'message: Bad Request code: 400',
				stack: axiosError.stack,
				data: JSON.stringify(error),
			});
		});
	});
});
