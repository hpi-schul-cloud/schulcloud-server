import { type Loggable } from '@shared/common/loggable';
import { type AxiosError, isAxiosError } from 'axios';
import util from 'node:util';
import { getAxiosErrorFields } from './axios-error-fields';
import { summarizeOpaqueLogValue } from './opaque-log-value';
import { isSensitiveName, maskSecret } from './sensitive-value';
import { type LogMessageWithContext } from './types';

export class LoggingUtils {
	/**
	 * Turns a loggable into separate log fields (message, data, error, ...) instead of one string,
	 * so that structured log formats like JSON can filter by them. Sensitive values are redacted.
	 */
	public static createMessageWithContext(loggable: Loggable, context?: string): LogMessageWithContext {
		const redactedMessage = this.redactSensitiveValue(loggable.getLogMessage());
		const { message, ...fields } = this.isRecord(redactedMessage) ? redactedMessage : { message: redactedMessage };

		return { message: this.toMessageText(message, fields), context, ...fields };
	}

	public static redactSensitiveValue(value: unknown): unknown {
		return this.redactSensitiveObject(value);
	}

	/**
	 * The redacted fields of an axios error that may be logged (method, URL, status, code, response body).
	 * For code that keeps an axios error for logging later, instead of the error with its request config.
	 */
	public static getSafeAxiosErrorFields(error: AxiosError): Record<string, unknown> {
		// A fresh plain object, so the result is always a record (never "[Circular]" or a summary).
		return this.redactSensitiveObject(getAxiosErrorFields(error)) as Record<string, unknown>;
	}

	// Error and validation log messages have no message of their own, so it is taken from the error or the type.
	private static toMessageText(message: unknown, fields: Record<string, unknown>): string {
		if (typeof message === 'string') {
			return message;
		}

		if (message !== undefined) {
			return util.inspect(message, { breakLength: Infinity });
		}

		const { error, type } = fields;
		if (this.isRecord(error) && typeof error.message === 'string') {
			return error.message;
		}

		return typeof type === 'string' ? type : '';
	}

	private static isRecord(value: unknown): value is Record<string, unknown> {
		return typeof value === 'object' && value !== null && !Array.isArray(value);
	}

	private static redactSensitiveObject(value: unknown, visited = new WeakSet<object>()): unknown {
		// Copies of axios errors (e.g. inside AxiosErrorLoggable) are plain objects, but carry the same request config.
		if (value instanceof Error || (isAxiosError(value) && typeof value.message === 'string')) {
			return this.redactError(value, visited);
		}

		if (typeof value === 'string') {
			return this.redactBearerToken(value);
		}

		const summary = typeof value === 'object' && value !== null ? summarizeOpaqueLogValue(value) : undefined;
		if (summary !== undefined) {
			return summary;
		}

		if (Array.isArray(value)) {
			return this.redactSensitiveArray(value, visited);
		}

		if (typeof value === 'object' && value !== null) {
			return this.redactSensitiveRecord(value, visited);
		}

		return value;
	}

	private static redactError(error: Error | AxiosError, visited: WeakSet<object>): unknown {
		if (visited.has(error)) {
			return '[Circular]';
		}

		visited.add(error);

		// A plain object instead of the Error itself: message and stack are not enumerable, so JSON output would drop them.
		const redactedError: Record<string, unknown> = {
			name: this.getErrorName(error),
			message: typeof error.message === 'string' ? this.redactBearerToken(error.message) : error.message,
			stack: typeof error.stack === 'string' ? this.redactBearerToken(error.stack) : error.stack,
		};

		const ownProperties = isAxiosError(error) ? getAxiosErrorFields(error) : error;
		for (const [key, val] of this.getLoggableEntries(ownProperties)) {
			// The cause is handled below, an enumerable cause (this.cause = cause) would otherwise be logged twice.
			if (key !== 'cause') {
				redactedError[key] = this.redactEntryValue(key, val, visited);
			}
		}

		if (error.cause !== undefined) {
			redactedError.cause = this.redactSensitiveObject(error.cause, visited);
		}

		return redactedError;
	}

	// Subclasses that don't set their own name are still called "Error", the class name is more useful.
	private static getErrorName(error: Error): string {
		return error.name === 'Error' ? error.constructor.name : error.name;
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

		for (const [key, val] of this.getLoggableEntries(value)) {
			// defineProperty instead of result[key]: a key "__proto__" (e.g. from parsed JSON) would set the prototype.
			Object.defineProperty(result, key, {
				value: this.redactEntryValue(key, val, visited),
				enumerable: true,
				writable: true,
				configurable: true,
			});
		}

		return result;
	}

	// Functions are left out: JSON.stringify would call a copied toJSON and could restore what was redacted.
	private static getLoggableEntries(value: object): [string, unknown][] {
		return Object.entries(value).filter(([, val]) => typeof val !== 'function');
	}

	private static redactEntryValue(key: string, value: unknown, visited: WeakSet<object>): unknown {
		// A boolean is never a secret, so flags such as forcePasswordChange or hasPin stay readable.
		if (!isSensitiveName(key) || typeof value === 'boolean') {
			return this.redactSensitiveObject(value, visited);
		}

		if (typeof value !== 'string') {
			return '[REDACTED]';
		}

		return maskSecret(value);
	}

	private static redactBearerToken(value: string): string {
		if (value.includes('[REDACTED]')) {
			return value;
		}

		return value.replace(
			/\b(Bearer)\s+([A-Z0-9._~+/=-]+)/gi,
			(match, scheme: string, token: string) => `${scheme} ${maskSecret(token)}`
		);
	}

	public static isInstanceOfLoggable(object: unknown): object is Loggable {
		return typeof object === 'object' && object !== null && 'getLogMessage' in object;
	}
}
