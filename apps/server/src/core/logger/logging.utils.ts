import util from 'util';
import { Loggable } from './interfaces';
import { LogMessageWithContext } from './types';

export class LoggingUtils {
	public static createMessageWithContext(loggable: Loggable, context?: string | undefined): LogMessageWithContext {
		const message = loggable.getLogMessage();
		const stringifiedMessage = this.stringifyMessage(message);
		const messageWithContext = { message: stringifiedMessage, context };

		return messageWithContext;
	}

	private static stringifyMessage(message: unknown): string {
		const redactedMessage = this.redactSensitiveObject(message);
		const inspectedMessage = util.inspect(redactedMessage);

		return inspectedMessage.replaceAll('\n', '').replaceAll('\\n', '');
	}

	private static isSensitiveFieldName(name: string): boolean {
		const lower = name.toLowerCase();

		return (
			lower.includes('cookie') ||
			lower.startsWith('x-api') ||
			lower.includes('auth') ||
			lower.includes('token') ||
			lower.includes('secret')
		);
	}

	private static redactSensitiveObject(value: unknown, visited = new WeakSet<object>()): unknown {
		if (value instanceof Error) {
			return value;
		}

		if (typeof value === 'string') {
			return this.redactBearerToken(value);
		}

		if (Array.isArray(value)) {
			if (visited.has(value)) return '[Circular]';
			visited.add(value);

			return value.map((item) => this.redactSensitiveObject(item, visited));
		}

		if (typeof value === 'object' && value !== null) {
			if (visited.has(value)) return '[Circular]';
			visited.add(value);

			const result: Record<string, unknown> = {};
			for (const [key, val] of Object.entries(value)) {
				result[key] = this.isSensitiveFieldName(key)
					? typeof val === 'string'
						? this.maskSecret(val)
						: '[REDACTED]'
					: this.redactSensitiveObject(val, visited);
			}

			return result;
		}

		return value;
	}

	private static redactBearerToken(value: string): string {
		if (value.includes('[REDACTED]')) {
			return value;
		}

		return value.replace(
			/\b(Bearer)\s+([A-Z0-9._~+/=-]+)/gi,
			(match, scheme: string, token: string) => `${scheme} ${this.maskSecret(token)}`
		);
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
