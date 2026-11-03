import { type Loggable, type LoggableMessage, type LogMessage } from '@shared/common/loggable';
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import util from 'node:util';
import { LoggingUtils } from './logging.utils';

// Renders everything that ends up in the log entry, so tests can check that a value is (not) logged anywhere.
const render = (value: unknown): string => util.inspect(value, { depth: null, breakLength: Infinity });

class SampleLoggable implements Loggable {
	constructor(private readonly message: LoggableMessage) {}

	getLogMessage(): LoggableMessage {
		return this.message;
	}
}

describe(LoggingUtils.name, () => {
	describe('createMessageWithContext', () => {
		it('should keep non-sensitive values unchanged', () => {
			const message = {
				message: 'request failed',
				data: {
					accept: 'application/json',
					headers: {
						'user-agent': 'Mozilla/5.0',
					},
				},
			};
			const loggable = new SampleLoggable(message);

			const result = LoggingUtils.createMessageWithContext(loggable, 'ctx');

			expect(result.context).toBe('ctx');

			expect(render(result)).toContain("message: 'request failed'");
			expect(render(result)).toContain("accept: 'application/json'");
			expect(render(result)).toContain("'user-agent': 'Mozilla/5.0'");

			expect(render(result)).not.toContain('[REDACTED]');
		});

		it('should redact sensitive header and token values while keeping header names', () => {
			const token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
			const cookie = 'session=verySensitiveSessionCookie';
			const apiKey = '123456789012345';

			const redactedToken = 'Bearer eyJh...J9 [REDACTED]';
			const redactedCookie = 'sess...ie [REDACTED]';
			const redactedApiKey = '1234...45 [REDACTED]';

			const loggable = new SampleLoggable({
				message: 'request failed',
				data: {
					headers: {
						Authorization: token,
						Cookie: cookie,
						'X-Api-Key': apiKey,
						Accept: 'application/json',
					},
					error: token,
				},
			});

			const result = LoggingUtils.createMessageWithContext(loggable);

			expect(render(result)).toContain('Authorization');
			expect(render(result)).toContain('Cookie');
			expect(render(result)).toContain('X-Api-Key');
			expect(render(result)).toContain('Accept');

			expect(render(result)).not.toContain(token);
			expect(render(result)).not.toContain(cookie);
			expect(render(result)).not.toContain(apiKey);

			expect(render(result)).toContain(redactedToken);
			expect(render(result)).toContain(redactedCookie);
			expect(render(result)).toContain(redactedApiKey);
		});

		it('should keep already redacted bearer token unchanged', () => {
			const token = 'Bearer abcdefghijklmnopqrstuvwxyz[REDACTED]';
			const loggable = new SampleLoggable({
				message: 'request failed',
				data: {
					error: token,
				},
			});

			const result = LoggingUtils.createMessageWithContext(loggable);

			expect(render(result)).toContain(token);
			expect(render(result)).not.toContain('...');
		});

		it('should redact blank and short sensitive values', () => {
			const loggable = new SampleLoggable({
				message: 'request failed',
				data: {
					Cookie: '   ',
					Secret: 'short',
				},
			});

			const result = LoggingUtils.createMessageWithContext(loggable);

			expect(render(result)).toContain("Cookie: '[REDACTED]'");
			expect(render(result)).toContain("Secret: '[REDACTED]'");
		});

		it('should replace circular arrays with circular marker', () => {
			const circularArray: unknown[] = [];
			circularArray.push(circularArray);

			const loggable = new SampleLoggable({
				message: 'request failed',
				data: {
					items: circularArray,
				},
			} as unknown as LogMessage);

			const result = LoggingUtils.createMessageWithContext(loggable);

			expect(render(result)).toContain("items: [ '[Circular]' ]");
		});

		it('should replace circular objects with circular marker', () => {
			const circularObject: Record<string, unknown> = {};
			circularObject.self = circularObject;

			const loggable = new SampleLoggable({
				message: 'request failed',
				data: {
					meta: circularObject,
				},
			} as unknown as LogMessage);

			const result = LoggingUtils.createMessageWithContext(loggable);

			expect(render(result)).toContain("self: '[Circular]'");
		});

		it('should redact non-string values for sensitive keys', () => {
			const loggable = new SampleLoggable({
				message: 'request failed',
				data: {
					AuthToken: 12345,
				},
			} as unknown as LogMessage);

			const result = LoggingUtils.createMessageWithContext(loggable);

			expect(render(result)).toContain("AuthToken: '[REDACTED]'");
		});

		it('should keep the message of Error instances in output', () => {
			const loggable = new SampleLoggable({
				message: 'request failed',
				data: {
					error: new Error('boom'),
				},
			} as unknown as LogMessage);

			const result = LoggingUtils.createMessageWithContext(loggable);

			expect(render(result)).toContain('Error: boom');
		});

		it('should keep non-sensitive primitive values unchanged', () => {
			const loggable = new SampleLoggable({
				message: 'request failed',
				data: {
					attempt: 2,
					retry: false,
				},
			} as unknown as LogMessage);

			const result = LoggingUtils.createMessageWithContext(loggable);

			expect(render(result)).toContain('attempt: 2');
			expect(render(result)).toContain('retry: false');
		});

		describe('when building log fields', () => {
			it('should return message and data as separate fields', () => {
				const loggable = new SampleLoggable({ message: 'user created', data: { userId: '123' } });

				const result = LoggingUtils.createMessageWithContext(loggable, 'UserService');

				expect(result).toEqual({ message: 'user created', context: 'UserService', data: { userId: '123' } });
			});

			it('should take the message of an error log message from the error', () => {
				const loggable = new SampleLoggable({ error: new Error('boom'), type: 'Technical Error' });

				const result = LoggingUtils.createMessageWithContext(loggable);

				expect(result).toEqual(
					expect.objectContaining({
						message: 'boom',
						type: 'Technical Error',
						error: expect.objectContaining({ name: 'Error', message: 'boom', stack: expect.any(String) }),
					})
				);
			});

			it('should take the message of a validation error log message from the type', () => {
				const loggable = new SampleLoggable({ validationErrors: ['wrong value'], type: 'API Validation Error' });

				const result = LoggingUtils.createMessageWithContext(loggable);

				expect(result).toEqual(
					expect.objectContaining({ message: 'API Validation Error', validationErrors: ['wrong value'] })
				);
			});

			it('should turn a message that is not a string into text', () => {
				const loggable = new SampleLoggable({ message: { text: 'hello' } } as unknown as LogMessage);

				const result = LoggingUtils.createMessageWithContext(loggable);

				expect(result.message).toBe("{ text: 'hello' }");
			});

			it('should keep message and stack of an error when serialized as JSON', () => {
				const loggable = new SampleLoggable({ error: new Error('boom'), type: 'Technical Error' });

				const result = LoggingUtils.createMessageWithContext(loggable);

				const { error } = JSON.parse(JSON.stringify(result)) as { error: { message: string; stack: string } };
				expect(error.message).toBe('boom');
				expect(error.stack).toContain('logging.utils.spec.ts');
			});

			it('should redact bearer tokens in the error message', () => {
				const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature';
				const loggable = new SampleLoggable({ error: new Error(`request with Bearer ${token} failed`), type: '' });

				const result = LoggingUtils.createMessageWithContext(loggable);

				expect(render(result)).not.toContain(token);
			});
		});

		describe('when an error is logged', () => {
			it('should redact sensitive own properties of the error', () => {
				const error = Object.assign(new Error('boom'), { accessToken: 'eyJhbGciOiJIUzI1NiJ9.payload', attempt: 2 });
				const loggable = new SampleLoggable({ error, type: 'Unhandled or Unknown Error' });

				const result = LoggingUtils.createMessageWithContext(loggable);

				expect(render(result)).not.toContain('eyJhbGciOiJIUzI1NiJ9.payload');
				expect(render(result)).toContain('attempt: 2');
				expect(render(result)).toContain('Error: boom');
			});

			it('should redact sensitive properties of the error cause', () => {
				const cause = Object.assign(new Error('inner'), { clientSecret: 'super-secret-client-secret-value' });
				const error = new Error('outer', { cause });
				const loggable = new SampleLoggable({ error, type: 'Unhandled or Unknown Error' });

				const result = LoggingUtils.createMessageWithContext(loggable);

				expect(render(result)).not.toContain('super-secret-client-secret-value');
				expect(render(result)).toContain('Error: outer');
				expect(render(result)).toContain('Error: inner');
			});

			it('should keep the stack trace of the error', () => {
				const error = new Error('boom');
				const loggable = new SampleLoggable({ error, type: 'Unhandled or Unknown Error' });

				const result = LoggingUtils.createMessageWithContext(loggable);

				expect(render(result)).toContain('logging.utils.spec.ts');
			});

			it('should keep the class name of the error', () => {
				class CustomError extends Error {}
				const loggable = new SampleLoggable({ error: new CustomError('boom'), type: 'Unhandled or Unknown Error' });

				const result = LoggingUtils.createMessageWithContext(loggable);

				expect(result.error).toEqual(expect.objectContaining({ name: 'CustomError', message: 'boom' }));
			});

			it('should not modify the original error', () => {
				const error = Object.assign(new Error('boom'), { accessToken: 'eyJhbGciOiJIUzI1NiJ9.payload' });
				const loggable = new SampleLoggable({ error, type: 'Unhandled or Unknown Error' });

				LoggingUtils.createMessageWithContext(loggable);

				expect(error.accessToken).toBe('eyJhbGciOiJIUzI1NiJ9.payload');
			});

			it('should replace a circular error cause with circular marker', () => {
				const error = new Error('boom');
				error.cause = error;
				const loggable = new SampleLoggable({ error, type: 'Unhandled or Unknown Error' });

				const result = LoggingUtils.createMessageWithContext(loggable);

				expect(render(result)).toContain('[Circular]');
			});
		});

		describe('when an axios error is logged', () => {
			const clientSecret = 'super-secret-client-secret-value';
			const basicCredentials = Buffer.from(`my-client:${clientSecret}`).toString('base64');

			const buildAxiosError = (url = 'https://idp.example.org/token?client_secret=abc123secret&scope=openid') => {
				const config = {
					method: 'post',
					url,
					headers: new AxiosHeaders({
						Authorization: `Basic ${basicCredentials}`,
						'Content-Type': 'application/x-www-form-urlencoded',
					}),
					auth: { username: 'my-client', password: clientSecret },
					data: `grant_type=client_credentials&client_secret=${clientSecret}`,
				} as InternalAxiosRequestConfig;
				const response = {
					status: 401,
					statusText: 'Unauthorized',
					headers: {},
					config,
					data: { error: 'invalid_client' },
				};

				return new AxiosError('Request failed with status code 401', 'ERR_BAD_REQUEST', config, {}, response);
			};

			const expectNoSecrets = (message: string) => {
				expect(message).not.toContain(clientSecret);
				expect(message).not.toContain(basicCredentials);
				expect(message).not.toContain('abc123secret');
				expect(message).not.toContain('grant_type');
			};

			it('should not log credentials of a raw axios error', () => {
				const loggable = new SampleLoggable({ error: buildAxiosError(), type: 'Unhandled or Unknown Error' });

				const result = LoggingUtils.createMessageWithContext(loggable);

				expectNoSecrets(render(result));
			});

			it('should keep method, url, status and code of a raw axios error', () => {
				const loggable = new SampleLoggable({ error: buildAxiosError(), type: 'Unhandled or Unknown Error' });

				const result = LoggingUtils.createMessageWithContext(loggable);

				expect(render(result)).toContain('AxiosError: Request failed with status code 401');
				expect(render(result)).toContain("code: 'ERR_BAD_REQUEST'");
				expect(render(result)).toContain('status: 401');
				expect(render(result)).toContain("method: 'POST'");
				expect(render(result)).toContain("url: 'https://idp.example.org/token?client_secret=[REDACTED]&scope=openid'");
			});

			it('should remove credentials from the axios request url', () => {
				const axiosError = buildAxiosError('https://my-client:url-password@idp.example.org/token');
				const loggable = new SampleLoggable({ error: axiosError, type: 'Unhandled or Unknown Error' });

				const result = LoggingUtils.createMessageWithContext(loggable);

				expect(render(result)).not.toContain('url-password');
				expect(render(result)).toContain("url: 'https://idp.example.org/token'");
			});

			it('should resolve a relative axios url against its base url', () => {
				const axiosError = buildAxiosError('/token?access_token=abc123secret');
				if (axiosError.config) {
					axiosError.config.baseURL = 'https://idp.example.org/api';
				}
				const loggable = new SampleLoggable({ error: axiosError, type: 'Unhandled or Unknown Error' });

				const result = LoggingUtils.createMessageWithContext(loggable);

				expect(render(result)).toContain("url: 'https://idp.example.org/token?access_token=[REDACTED]'");
			});

			it('should not log credentials of an axios error used as cause', () => {
				const error = new Error('token request failed', { cause: buildAxiosError() });
				const loggable = new SampleLoggable({ error, type: 'Unhandled or Unknown Error' });

				const result = LoggingUtils.createMessageWithContext(loggable);

				expectNoSecrets(render(result));
				expect(render(result)).toContain('Error: token request failed');
				expect(render(result)).toContain('AxiosError: Request failed with status code 401');
			});

			it('should not modify the original axios error', () => {
				const axiosError = buildAxiosError();
				const loggable = new SampleLoggable({ error: axiosError, type: 'Unhandled or Unknown Error' });

				LoggingUtils.createMessageWithContext(loggable);

				expect(axiosError.config?.data).toContain(clientSecret);
			});
		});
	});

	describe('isInstanceOfLoggable', () => {
		it('should return true for a loggable-like object', () => {
			const loggableLike = {
				getLogMessage: () => {
					return { message: 'ok' };
				},
			};

			expect(LoggingUtils.isInstanceOfLoggable(loggableLike)).toBe(true);
		});

		it('should return false for non-object values', () => {
			expect(LoggingUtils.isInstanceOfLoggable('text')).toBe(false);
			expect(LoggingUtils.isInstanceOfLoggable(42)).toBe(false);
		});

		it('should return false for null and objects without getLogMessage', () => {
			expect(LoggingUtils.isInstanceOfLoggable(null)).toBe(false);
			expect(LoggingUtils.isInstanceOfLoggable({})).toBe(false);
		});
	});
});
