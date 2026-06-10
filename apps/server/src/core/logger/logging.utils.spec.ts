import { Loggable } from './interfaces';
import { LoggingUtils } from './logging.utils';
import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from './types';

class SampleLoggable implements Loggable {
	constructor(private readonly message: LogMessage | ErrorLogMessage | ValidationErrorLogMessage) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
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
	});
});
