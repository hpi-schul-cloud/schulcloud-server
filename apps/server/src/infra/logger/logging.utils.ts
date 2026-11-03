import { type Loggable } from '@shared/common/loggable';
import { type AxiosError, isAxiosError } from 'axios';
import util from 'node:util';
import { type LogMessageWithContext } from './types';

export class LoggingUtils {
	public static createMessageWithContext(loggable: Loggable, context?: string): LogMessageWithContext {
		const message = loggable.getLogMessage();
		const stringifiedMessage = this.stringifyMessage(message);
		const messageWithContext = { message: stringifiedMessage, context };

		return messageWithContext;
	}

	public static redactSensitiveValue(value: unknown): unknown {
		return this.redactSensitiveObject(value);
	}

	private static stringifyMessage(message: unknown): string {
		const redactedMessage = this.redactSensitiveValue(message);
		const inspectedMessage = util.inspect(redactedMessage);

		return inspectedMessage.replaceAll('\n', '').replaceAll(String.raw`\n`, '');
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
			return this.redactError(value, visited);
		}

		if (typeof value === 'string') {
			return this.redactBearerToken(value);
		}

		if (Array.isArray(value)) {
			return this.redactSensitiveArray(value, visited);
		}

		if (typeof value === 'object' && value !== null) {
			return this.redactSensitiveRecord(value, visited);
		}

		return value;
	}

	private static redactError(error: Error, visited: WeakSet<object>): unknown {
		if (visited.has(error)) {
			return '[Circular]';
		}

		visited.add(error);

		// Copy the error instead of changing it. A real Error keeps util.inspect printing it as an error (with stack),
		// the original prototype keeps its class name.
		const redactedError = new Error(error.message);
		Object.setPrototypeOf(redactedError, Object.getPrototypeOf(error) as object);
		const ownProperties = isAxiosError(error) ? this.getSafeAxiosErrorProperties(error) : { ...error };

		const redactedRecord = redactedError as unknown as Record<string, unknown>;
		for (const [key, val] of Object.entries(ownProperties)) {
			redactedRecord[key] = this.redactEntryValue(key, val, visited);
		}

		Object.defineProperty(redactedError, 'stack', { value: error.stack, enumerable: false, writable: true });

		if (error.cause !== undefined) {
			Object.defineProperty(redactedError, 'cause', {
				value: this.redactSensitiveObject(error.cause, visited),
				enumerable: false,
			});
		}

		return redactedError;
	}

	// Axios errors carry the full request config (headers, auth, body) and response. Only these fields are safe to log.
	private static getSafeAxiosErrorProperties(error: AxiosError): Record<string, unknown> {
		return {
			code: error.code,
			status: error.response?.status ?? error.status,
			method: error.config?.method?.toUpperCase(),
			url: this.redactUrl(error.config?.url, error.config?.baseURL),
		};
	}

	private static redactUrl(url: string | undefined, baseUrl: string | undefined): string | undefined {
		if (!url) {
			return url;
		}

		const placeholderOrigin = 'http://relative.invalid';
		let parsedUrl: URL;
		try {
			parsedUrl = new URL(url, baseUrl ?? placeholderOrigin);
		} catch {
			return '[REDACTED]';
		}

		parsedUrl.username = '';
		parsedUrl.password = '';
		for (const name of new Set(parsedUrl.searchParams.keys())) {
			if (this.isSensitiveFieldName(name)) {
				parsedUrl.searchParams.set(name, 'REDACTED_VALUE');
			}
		}

		const redactedUrl = parsedUrl.toString().replaceAll('REDACTED_VALUE', '[REDACTED]');

		return redactedUrl.startsWith(placeholderOrigin) ? redactedUrl.slice(placeholderOrigin.length) : redactedUrl;
	}

	private static redactSensitiveArray(value: unknown[], visited: WeakSet<object>): unknown {
		if (visited.has(value)) {
			return '[Circular]';
		}

		visited.add(value);
		return value.map((item) => this.redactSensitiveObject(item, visited));
	}

	private static redactSensitiveRecord(value: object, visited: WeakSet<object>): unknown {
		if (visited.has(value)) {
			return '[Circular]';
		}

		visited.add(value);
		const result: Record<string, unknown> = {};

		for (const [key, val] of Object.entries(value)) {
			result[key] = this.redactEntryValue(key, val, visited);
		}

		return result;
	}

	private static redactEntryValue(key: string, value: unknown, visited: WeakSet<object>): unknown {
		if (!this.isSensitiveFieldName(key)) {
			return this.redactSensitiveObject(value, visited);
		}

		if (typeof value !== 'string') {
			return '[REDACTED]';
		}

		return this.maskSecret(value);
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

	public static isInstanceOfLoggable(object: unknown): object is Loggable {
		return typeof object === 'object' && object !== null && 'getLogMessage' in object;
	}
}
