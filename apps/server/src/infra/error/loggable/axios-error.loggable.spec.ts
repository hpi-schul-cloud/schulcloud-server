import { HttpStatus } from '@nestjs/common';
import { axiosErrorFactory } from '@testing/factory/axios-error.factory';
import { AxiosError } from 'axios';
import util from 'node:util';
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

		it('should return empty object when axios toJSON returns non-object value', () => {
			const axiosError = axiosErrorFactory.withError({ error: 'invalid_request' }).build({
				toJSON: () => 'not-an-object' as unknown as object,
			});

			const axiosErrorLoggable = new AxiosErrorLoggable(axiosError, 'mockType');
			const internalAxiosError = (axiosErrorLoggable as unknown as { axiosError: AxiosError }).axiosError;

			expect(internalAxiosError.toJSON()).toEqual({});
		});

		it('should keep non-object config unchanged in axios toJSON output', () => {
			const axiosError = axiosErrorFactory.withError({ error: 'invalid_request' }).build({
				toJSON: () => {
					return {
						config: 'raw-config',
					};
				},
			});

			const axiosErrorLoggable = new AxiosErrorLoggable(axiosError, 'mockType');
			const internalAxiosError = (axiosErrorLoggable as unknown as { axiosError: AxiosError }).axiosError;
			const toJsonResult = internalAxiosError.toJSON() as { config?: unknown };

			expect(toJsonResult.config).toBe('raw-config');
		});

		it('should handle array and non-object headers in config redaction', () => {
			const accessToken = 'Bearer abcdefghijklmnopqrst';
			const invalidArrayHeaders = [accessToken, 123] as unknown as Record<string, unknown>;
			const axiosErrorWithArrayHeaders = axiosErrorFactory.withError({ error: 'invalid_request' }).build({
				config: {
					headers: invalidArrayHeaders,
				},
			});

			const loggableWithArrayHeaders = new AxiosErrorLoggable(axiosErrorWithArrayHeaders, 'mockType');
			const internalAxiosErrorWithArrayHeaders = (loggableWithArrayHeaders as unknown as { axiosError: AxiosError })
				.axiosError;
			const arrayHeaders = internalAxiosErrorWithArrayHeaders.config?.headers as unknown as unknown[];

			expect(Array.isArray(internalAxiosErrorWithArrayHeaders.config?.headers)).toBe(true);
			expect(arrayHeaders[0]).toContain('[REDACTED]');
			expect(arrayHeaders[1]).toBe('[REDACTED]');

			const invalidScalarHeaders = 'raw-headers' as unknown as Record<string, unknown>;
			const axiosErrorWithNonObjectHeaders = axiosErrorFactory.withError({ error: 'invalid_request' }).build({
				config: {
					headers: invalidScalarHeaders,
				},
			});

			const loggableWithNonObjectHeaders = new AxiosErrorLoggable(axiosErrorWithNonObjectHeaders, 'mockType');
			const internalAxiosErrorWithNonObjectHeaders = (
				loggableWithNonObjectHeaders as unknown as { axiosError: AxiosError }
			).axiosError;

			expect(internalAxiosErrorWithNonObjectHeaders.config?.headers).toBe('raw-headers');
		});

		it('should redact array header values and short secrets', () => {
			const bearerHeaderArray = ['Bearer abcdefghijklmnopqrst', 'short'];
			const axiosError = axiosErrorFactory.withError({ error: 'invalid_request' }).build({
				config: {
					headers: {
						Authorization: bearerHeaderArray,
						Secret: 123,
						Cookie: 'short',
					},
				},
			});

			const axiosErrorLoggable = new AxiosErrorLoggable(axiosError, 'mockType');
			const internalAxiosError = (axiosErrorLoggable as unknown as { axiosError: AxiosError }).axiosError;
			const headers = internalAxiosError.config?.headers as Record<string, unknown>;

			expect(Array.isArray(headers.Authorization)).toBe(true);
			expect((headers.Authorization as string[])[0]).toContain('[REDACTED]');
			expect((headers.Authorization as string[])[1]).toBe('[REDACTED]');
			expect(headers.Secret).toBe('[REDACTED]');
			expect(headers.Cookie).toBe('[REDACTED]');
		});

		it('should redact sensitive values in response data for log message and inspect output', () => {
			const accessToken = 'Bearer abcdefghijklmnopqrst';
			const sessionSecret = 'verySensitiveSessionSecret';
			const axiosError = axiosErrorFactory
				.withError({
					accessToken,
					secret: sessionSecret,
					ok: true,
				})
				.build();

			const axiosErrorLoggable = new AxiosErrorLoggable(axiosError, 'mockType');
			const logMessage = axiosErrorLoggable.getLogMessage();
			const inspected = util.inspect({ error: axiosErrorLoggable }, { depth: null });
			const logData = 'data' in logMessage ? logMessage.data : undefined;

			expect(logData).toBeDefined();
			expect(logData).toContain('accessToken');
			expect(logData).toContain('secret');
			expect(logData).toContain('ok: true');
			expect(logData).toContain('[REDACTED]');
			expect(logData).not.toContain(accessToken);
			expect(logData).not.toContain(sessionSecret);

			expect(inspected).toContain('accessToken');
			expect(inspected).toContain('secret');
			expect(inspected).toContain('ok: true');
			expect(inspected).toContain('[REDACTED]');
			expect(inspected).not.toContain(accessToken);
			expect(inspected).not.toContain(sessionSecret);
		});

		it('should redact sensitive values in response data for axios toJSON output', () => {
			const accessToken = 'Bearer abcdefghijklmnopqrst';
			const sessionSecret = 'verySensitiveSessionSecret';
			const axiosError = axiosErrorFactory.withError({ error: 'invalid_request' }).build({
				toJSON: () => {
					return {
						response: {
							data: {
								accessToken,
								secret: sessionSecret,
								ok: true,
							},
						},
					};
				},
			});

			const axiosErrorLoggable = new AxiosErrorLoggable(axiosError, 'mockType');
			const internalAxiosError = (axiosErrorLoggable as unknown as { axiosError: AxiosError }).axiosError;
			const toJsonResult = internalAxiosError.toJSON() as {
				response?: { data?: Record<string, unknown> };
			};

			expect(toJsonResult.response?.data?.accessToken).toContain('[REDACTED]');
			expect(toJsonResult.response?.data?.accessToken).not.toBe(accessToken);
			expect(toJsonResult.response?.data?.secret).toContain('[REDACTED]');
			expect(toJsonResult.response?.data?.secret).not.toBe(sessionSecret);
			expect(toJsonResult.response?.data?.ok).toBe(true);
		});

		it('should use fallback status and code when axios metadata is missing', () => {
			const axiosError = axiosErrorFactory.withError({ error: 'invalid_request' }).build({
				status: undefined,
				code: undefined,
				config: undefined,
				response: undefined,
				toJSON: undefined,
			});

			const axiosErrorLoggable = new AxiosErrorLoggable(axiosError, 'mockType');
			const logMessage = axiosErrorLoggable.getLogMessage();
			const internalAxiosError = (axiosErrorLoggable as unknown as { axiosError: AxiosError }).axiosError;
			const message = 'message' in logMessage ? logMessage.message : undefined;
			const data = 'data' in logMessage ? logMessage.data : undefined;

			expect(axiosErrorLoggable.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
			expect(message).toBe('message: Bad Request code: Unknown code');
			expect(data).toBe('undefined');
			expect(internalAxiosError.toJSON()).toEqual({ config: undefined, response: undefined });
		});

		it('should keep non-object response unchanged in axios toJSON output', () => {
			const axiosError = axiosErrorFactory.withError({ error: 'invalid_request' }).build({
				toJSON: () => {
					return {
						response: 'raw-response',
					};
				},
			});

			const axiosErrorLoggable = new AxiosErrorLoggable(axiosError, 'mockType');
			const internalAxiosError = (axiosErrorLoggable as unknown as { axiosError: AxiosError }).axiosError;
			const toJsonResult = internalAxiosError.toJSON() as { response?: unknown };

			expect(toJsonResult.response).toBe('raw-response');
		});
	});
});
