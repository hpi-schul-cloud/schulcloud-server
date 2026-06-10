import { axiosErrorFactory } from '@testing/factory/axios-error.factory';
import { AxiosError } from 'axios';
import { AxiosErrorLoggable } from './axios-error.loggable';
import util from 'util';

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
				data: util.inspect(error),
				stack: axiosErrorLoggable.stack,
			});
		});

		it('should redact sensitive axios headers in inspect output', () => {
			const accessToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abcdefghijklmnopqrstuvwxyz';
			const cookie = 'session=superSecretSessionCookieValue';
			const axiosError = axiosErrorFactory.withError({ error: 'invalid_request' }).build({
				config: {
					headers: {
						Authorization: accessToken,
						Cookie: cookie,
						Accept: 'application/json',
					},
				},
			});

			const axiosErrorLoggable = new AxiosErrorLoggable(axiosError, 'mockType');
			const inspected = util.inspect({ error: axiosErrorLoggable }, { depth: null });

			expect(inspected).toContain('Authorization');
			expect(inspected).toContain('Cookie');
			expect(inspected).toContain('Accept');
			expect(inspected).toContain('[REDACTED]');

			expect(inspected).not.toContain(accessToken);
			expect(inspected).not.toContain(cookie);
		});

		it('should redact sensitive headers in axios toJSON output', () => {
			const accessToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abcdefghijklmnopqrstuvwxyz';
			const apiKey = '12345678901234567890';
			const axiosError = axiosErrorFactory.withError({ error: 'invalid_request' }).build({
				toJSON: () => {
					return {
						config: {
							headers: {
								Authorization: accessToken,
								'X-Api-Key': apiKey,
								Accept: 'application/json',
							},
						},
					};
				},
			});

			const axiosErrorLoggable = new AxiosErrorLoggable(axiosError, 'mockType');
			const internalAxiosError = (axiosErrorLoggable as unknown as { axiosError: AxiosError }).axiosError;
			const toJsonResult = internalAxiosError.toJSON() as {
				config?: { headers?: Record<string, unknown> };
			};

			expect(toJsonResult.config?.headers?.Authorization).toContain('[REDACTED]');
			expect(toJsonResult.config?.headers?.Authorization).not.toBe(accessToken);
			expect(toJsonResult.config?.headers?.['X-Api-Key']).toContain('[REDACTED]');
			expect(toJsonResult.config?.headers?.['X-Api-Key']).not.toBe(apiKey);
			expect(toJsonResult.config?.headers?.Accept).toBe('application/json');
		});
	});
});
