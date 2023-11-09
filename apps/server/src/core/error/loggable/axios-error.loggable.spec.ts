import { AxiosError } from 'axios';
import { AxiosErrorLoggable } from './axios-error.loggable';

describe(AxiosErrorLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const axiosError = {
				response: {
					data: {
						error: {
							message: 'mockMessage',
						},
					},
				},
				status: 400,
				stack: 'mockStack',
			} as unknown as AxiosError;
			const type = 'mockType';
			const axiosErrorLoggable = new AxiosErrorLoggable(axiosError, type);
			return { axiosErrorLoggable };
		};

		it('should return error log message', () => {
			const { axiosErrorLoggable } = setup();

			const result = axiosErrorLoggable.getLogMessage();

			expect(result).toEqual({
				type: 'mockType',
				error: {
					response: {
						data: {
							error: {
								message: 'mockMessage',
							},
						},
					},
					status: 400,
					stack: 'mockStack',
				},
				stack: 'mockStack',
			});
		});
	});
});
