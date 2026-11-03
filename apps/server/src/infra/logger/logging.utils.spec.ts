import { type Loggable, type LoggableMessage, type LogMessage } from '@shared/common/loggable';
import { LoggingUtils } from './logging.utils';

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

			expect(result.message).toContain("message: 'request failed'");
			expect(result.message).toContain("accept: 'application/json'");
			expect(result.message).toContain("'user-agent': 'Mozilla/5.0'");

			expect(result.message).not.toContain('[REDACTED]');
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

			expect(result.message).toContain('Authorization');
			expect(result.message).toContain('Cookie');
			expect(result.message).toContain('X-Api-Key');
			expect(result.message).toContain('Accept');

			expect(result.message).not.toContain(token);
			expect(result.message).not.toContain(cookie);
			expect(result.message).not.toContain(apiKey);

			expect(result.message).toContain(redactedToken);
			expect(result.message).toContain(redactedCookie);
			expect(result.message).toContain(redactedApiKey);
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

			expect(result.message).toContain(token);
			expect(result.message).not.toContain('...');
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

			expect(result.message).toContain("Cookie: '[REDACTED]'");
			expect(result.message).toContain("Secret: '[REDACTED]'");
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

			expect(result.message).toContain("items: [ '[Circular]' ]");
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

			expect(result.message).toContain("self: '[Circular]'");
		});

		it('should redact non-string values for sensitive keys', () => {
			const loggable = new SampleLoggable({
				message: 'request failed',
				data: {
					AuthToken: 12345,
				},
			} as unknown as LogMessage);

			const result = LoggingUtils.createMessageWithContext(loggable);

			expect(result.message).toContain("AuthToken: '[REDACTED]'");
		});

		it('should keep the message of Error instances in output', () => {
			const loggable = new SampleLoggable({
				message: 'request failed',
				data: {
					error: new Error('boom'),
				},
			} as unknown as LogMessage);

			const result = LoggingUtils.createMessageWithContext(loggable);

			expect(result.message).toContain('Error: boom');
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

			expect(result.message).toContain('attempt: 2');
			expect(result.message).toContain('retry: false');
		});

		describe('when an error is logged', () => {
			it('should redact sensitive own properties of the error', () => {
				const error = Object.assign(new Error('boom'), { accessToken: 'eyJhbGciOiJIUzI1NiJ9.payload', attempt: 2 });
				const loggable = new SampleLoggable({ error, type: 'Unhandled or Unknown Error' });

				const result = LoggingUtils.createMessageWithContext(loggable);

				expect(result.message).not.toContain('eyJhbGciOiJIUzI1NiJ9.payload');
				expect(result.message).toContain('attempt: 2');
				expect(result.message).toContain('Error: boom');
			});

			it('should redact sensitive properties of the error cause', () => {
				const cause = Object.assign(new Error('inner'), { clientSecret: 'super-secret-client-secret-value' });
				const error = new Error('outer', { cause });
				const loggable = new SampleLoggable({ error, type: 'Unhandled or Unknown Error' });

				const result = LoggingUtils.createMessageWithContext(loggable);

				expect(result.message).not.toContain('super-secret-client-secret-value');
				expect(result.message).toContain('Error: outer');
				expect(result.message).toContain('Error: inner');
			});

			it('should keep the stack trace of the error', () => {
				const error = new Error('boom');
				const loggable = new SampleLoggable({ error, type: 'Unhandled or Unknown Error' });

				const result = LoggingUtils.createMessageWithContext(loggable);

				expect(result.message).toContain('logging.utils.spec.ts');
			});

			it('should keep the class name of the error', () => {
				class CustomError extends Error {}
				const loggable = new SampleLoggable({ error: new CustomError('boom'), type: 'Unhandled or Unknown Error' });

				const result = LoggingUtils.createMessageWithContext(loggable);

				expect(result.message).toContain('CustomError: boom');
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

				expect(result.message).toContain('[Circular]');
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
