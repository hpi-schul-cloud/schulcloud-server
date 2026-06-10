import util from 'util';
import { Loggable } from './interfaces';
import { LogMessageWithContext } from './types';

export class LoggingUtils {
	private static readonly SENSITIVE_FIELD_PATTERN =
		/(authorization|proxy-authorization|cookie|set-cookie|x-api[-_]?key|x-auth[\w-]*|x-api[\w-]*|[\w-]*auth[\w-]*|[\w-]*token[\w-]*|[\w-]*secret[\w-]*)/i;

	public static createMessageWithContext(loggable: Loggable, context?: string | undefined): LogMessageWithContext {
		const message = loggable.getLogMessage();
		const stringifiedMessage = this.stringifyMessage(message);
		const messageWithContext = { message: stringifiedMessage, context };

		return messageWithContext;
	}

	private static stringifyMessage(message: unknown): string {
		const inspectedMessage = util.inspect(message);
		const redactedMessage = this.redactSensitiveContent(inspectedMessage);
		const stringifiedMessage = redactedMessage.replace(/\n/g, '').replace(/\\n/g, '');

		return stringifiedMessage;
	}

	private static redactSensitiveContent(message: string): string {
		const singleQuoteRedacted = message.replace(
			/((?:'|")?[\w-]+(?:'|")?\s*:\s*)'([^']*)'/gi,
			(match, keyWithSeparator: string, value: string) => {
				const key = keyWithSeparator
					.split(':')[0]
					.trim()
					.replace(/^['"]|['"]$/g, '');
				if (!this.SENSITIVE_FIELD_PATTERN.test(key)) {
					return match;
				}

				return `${keyWithSeparator}'${this.maskSecret(value)}'`;
			}
		);

		const doubleQuoteRedacted = singleQuoteRedacted.replace(
			/((?:'|")?[\w-]+(?:'|")?\s*:\s*)"([^"]*)"/gi,
			(match, keyWithSeparator: string, value: string) => {
				const key = keyWithSeparator
					.split(':')[0]
					.trim()
					.replace(/^['"]|['"]$/g, '');
				if (!this.SENSITIVE_FIELD_PATTERN.test(key)) {
					return match;
				}

				return `${keyWithSeparator}"${this.maskSecret(value)}"`;
			}
		);

		const bearerRedacted = doubleQuoteRedacted.replace(
			/\b(Bearer)\s+([A-Za-z0-9._~+/=-]+)/gi,
			(match, scheme: string, token: string) => {
				if (token.includes('[REDACTED]')) {
					return match;
				}

				return `${scheme} ${this.maskSecret(token)}`;
			}
		);

		return bearerRedacted;
	}

	private static maskSecret(secret: string): string {
		const trimmedSecret = secret.trim();
		if (!trimmedSecret) {
			return '[REDACTED]';
		}

		const [scheme, credential, ...rest] = trimmedSecret.split(/\s+/);
		if (credential && rest.length === 0) {
			return `${scheme} ${this.maskCredential(credential)}`;
		}

		return this.maskCredential(trimmedSecret);
	}

	private static maskCredential(value: string): string {
		if (value.length <= 8) {
			return '[REDACTED]';
		}

		return `${value.slice(0, 4)}...${value.slice(-2)} [REDACTED]`;
	}

	public static isInstanceOfLoggable(object: any): object is Loggable {
		return 'getLogMessage' in object;
	}
}
