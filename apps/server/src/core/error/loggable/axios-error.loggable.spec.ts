import { axiosErrorFactory } from '@shared/testing/factory';
import { AxiosError } from 'axios';
import { AxiosErrorLoggable } from './axios-error.loggable';

describe(AxiosErrorLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const error = {
				error: 'invalid_request',
			};
			const type = 'mockType';
			const axiosError: AxiosError = axiosErrorFactory.withError(error).build();

			const axiosErrorLoggable = new AxiosErrorLoggable(axiosError, type);

			return { axiosErrorLoggable, error, axiosError };
		};

		it('should return error log message', () => {
			const { axiosErrorLoggable, error } = setup();

			const result = axiosErrorLoggable.getLogMessage();

			expect(result).toEqual({
				type: 'mockType',
				message: 'message: Bad Request code: 400',
				data: JSON.stringify(error),
				stack: 'mockStack',
			});
		});
	});
});
