import { LoggingUtils } from '@infra/logger';
import { HttpStatus } from '@nestjs/common';
import { axiosErrorFactory } from '@testing/factory/axios-error.factory';
import { type AxiosError } from 'axios';
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

		describe('when the request carried credentials', () => {
			const accessToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abcdefghijklmnopqrstuvwxyz';
			const cookie = 'session=superSecretSessionCookieValue';
			const basicPassword = 'basicAuthPassword123';
			const bodyPassword = 'requestBodyPassword123';

			const setupWithCredentials = () => {
				const axiosError = axiosErrorFactory.withError({ error: 'invalid_request' }).build({
					config: {
						method: 'post',
						url: 'https://idm.example.org/token',
						headers: { Authorization: accessToken, Cookie: cookie, Accept: 'application/json' },
						auth: { username: 'client', password: basicPassword },
						data: JSON.stringify({ password: bodyPassword }),
					},
				});

				return { axiosErrorLoggable: new AxiosErrorLoggable(axiosError, 'mockType') };
			};

			it('should not show them in inspect output', () => {
				const { axiosErrorLoggable } = setupWithCredentials();

				const inspected = util.inspect({ error: axiosErrorLoggable }, { depth: null });

				[accessToken, cookie, basicPassword, bodyPassword].forEach((secret) => expect(inspected).not.toContain(secret));
			});

			it('should not show them in JSON output', () => {
				const { axiosErrorLoggable } = setupWithCredentials();

				const json = JSON.stringify(axiosErrorLoggable);

				[accessToken, cookie, basicPassword, bodyPassword].forEach((secret) => expect(json).not.toContain(secret));
			});

			it('should not show them when the logger redacts the exception again', () => {
				const { axiosErrorLoggable } = setupWithCredentials();

				const logged = JSON.stringify(LoggingUtils.redactSensitiveValue({ error: axiosErrorLoggable }));

				[accessToken, cookie, basicPassword, bodyPassword].forEach((secret) => expect(logged).not.toContain(secret));
			});

			it('should keep method, url, status and code in inspect output', () => {
				const { axiosErrorLoggable } = setupWithCredentials();

				const inspected = util.inspect(axiosErrorLoggable, { depth: null });

				expect(inspected).toContain("method: 'POST'");
				expect(inspected).toContain('https://idm.example.org/token');
				expect(inspected).toContain('status: 400');
				expect(inspected).toContain("code: '400'");
			});
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

		it('should mask a secret in the response data only once when the logger redacts the exception again', () => {
			const axiosError = axiosErrorFactory.withError({ accessToken: 'abcdefghijklmnopqrst' }).build();
			const axiosErrorLoggable = new AxiosErrorLoggable(axiosError, 'mockType');

			const logged = LoggingUtils.redactSensitiveValue({ error: axiosErrorLoggable }) as {
				error: { axiosError: { responseData: { accessToken: string } } };
			};

			expect(logged.error.axiosError.responseData.accessToken).toBe('abcd...st [REDACTED]');
		});

		it('should use fallback status and code when axios metadata is missing', () => {
			const axiosError = axiosErrorFactory.withError({ error: 'invalid_request' }).build({
				status: undefined,
				code: undefined,
				config: undefined,
				response: undefined,
			});

			const axiosErrorLoggable = new AxiosErrorLoggable(axiosError, 'mockType');
			const logMessage = axiosErrorLoggable.getLogMessage();
			const message = 'message' in logMessage ? logMessage.message : undefined;
			const data = 'data' in logMessage ? logMessage.data : undefined;

			expect(axiosErrorLoggable.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
			expect(message).toBe('message: Bad Request code: Unknown code');
			expect(data).toBe('undefined');
		});

		describe('when the request used a presigned S3 url', () => {
			const presignedUrl =
				'https://bucket.s3.example.org/file.pdf?X-Amz-Credential=AKIAEXAMPLEKEY%2F20261119%2Feu-central-1%2Fs3%2Faws4_request&X-Amz-Expires=300&X-Amz-Signature=0123456789abcdef';

			it('should not show the signature and access key in inspect output', () => {
				const axiosError = axiosErrorFactory.withError({ error: 'denied' }).build({ config: { url: presignedUrl } });

				const inspected = util.inspect(new AxiosErrorLoggable(axiosError, 'mockType'), { depth: null });

				expect(inspected).not.toContain('AKIAEXAMPLEKEY');
				expect(inspected).not.toContain('0123456789abcdef');
				expect(inspected).toContain('X-Amz-Expires=300');
			});
		});

		it('should decode a text response body received as binary', () => {
			const body = Buffer.from('<Error><Code>SignatureDoesNotMatch</Code></Error>');
			const axiosError = axiosErrorFactory.withError({ error: 'denied' }).build();
			Object.assign(axiosError.response ?? {}, { data: body, headers: { 'Content-Type': 'application/xml' } });

			const result = new AxiosErrorLoggable(axiosError, 'mockType').getLogMessage();

			expect(JSON.stringify(result)).toContain('SignatureDoesNotMatch');
		});
	});
});
