import { type Loggable } from '@shared/common/loggable';
import { type AxiosError, isAxiosError } from 'axios';
import util from 'node:util';
import { summarizeOpaqueLogValue } from './opaque-log-value';
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
	 * Prepares the body of a failed response for logging, because external APIs explain their errors there.
	 * Text is truncated. A text body received as binary (axios responseType 'arraybuffer') is decoded first.
	 * Other binary bodies and streams are logged as a short summary.
	 */
	public static prepareResponseBody(body: unknown, headers: unknown): unknown {
		return this.truncateText(this.decodeTextBody(body, this.getContentType(headers)) ?? body);
	}

	/**
	 * Removes credentials and the values of sensitive query parameters from a request URL.
	 * A relative URL is resolved against its base URL like axios does.
	 */
	public static redactUrl(url: string | undefined, baseUrl: string | undefined): string | undefined {
		if (!url) {
			return url;
		}

		// Like axios: a relative url is appended to the base url including its path (/api + /token = /api/token).
		const isAbsoluteUrl = /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
		const fullUrl =
			baseUrl && !isAbsoluteUrl ? `${this.trimSlashes(baseUrl, 'end')}/${this.trimSlashes(url, 'start')}` : url;

		// A relative URL without base URL can only be parsed against a placeholder; only its path, query and hash are logged.
		// With a base URL, the combined URL must be absolute, otherwise it is redacted.
		const isRelativeWithoutBase = !baseUrl && !URL.canParse(url);
		let parsedUrl: URL;
		try {
			parsedUrl = baseUrl ? new URL(fullUrl) : new URL(fullUrl, 'https://relative.invalid');
		} catch {
			return '[REDACTED]';
		}

		parsedUrl.username = '';
		parsedUrl.password = '';
		for (const name of new Set(parsedUrl.searchParams.keys())) {
			if (this.isSensitiveQueryParamName(name)) {
				parsedUrl.searchParams.set(name, 'REDACTED_VALUE');
			}
		}

		const redactedUrl = isRelativeWithoutBase
			? `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`
			: parsedUrl.toString();

		return redactedUrl.replaceAll('REDACTED_VALUE', '[REDACTED]');
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

	private static isSensitiveFieldName(name: string): boolean {
		return this.isSensitiveLowerCaseName(name.toLowerCase());
	}

	private static isSensitiveLowerCaseName(lower: string): boolean {
		return (
			lower.includes('cookie') ||
			lower.startsWith('x-api') ||
			lower.includes('auth') ||
			lower.includes('token') ||
			lower.includes('secret')
		);
	}

	// Presigned S3 URLs carry a working signature and the access key id; the URL could be used until it expires.
	private static isSensitiveQueryParamName(name: string): boolean {
		const lower = name.toLowerCase();

		return (
			this.isSensitiveLowerCaseName(lower) ||
			lower.includes('signature') ||
			lower.includes('credential') ||
			lower.includes('awsaccesskeyid')
		);
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

		const ownProperties = isAxiosError(error) ? this.getSafeAxiosErrorProperties(error) : error;
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

	// Axios errors carry the full request config (headers, auth, body) with our credentials. Only these fields are logged.
	// The response body is kept (redacted like any other value), see prepareResponseBody.
	private static getSafeAxiosErrorProperties(error: AxiosError): Record<string, unknown> {
		return {
			code: error.code,
			status: error.response?.status ?? error.status,
			statusText: error.response?.statusText,
			method: error.config?.method?.toUpperCase(),
			url: this.redactUrl(error.config?.url, error.config?.baseURL),
			responseData: this.prepareResponseBody(error.response?.data, error.response?.headers),
		};
	}

	// Plain objects and AxiosHeaders (which keeps headers as own properties); header names are case-insensitive.
	private static getContentType(headers: unknown): unknown {
		if (!this.isRecord(headers)) {
			return undefined;
		}

		const name = Object.keys(headers).find((key) => key.toLowerCase() === 'content-type');

		return name ? headers[name] : undefined;
	}

	private static decodeTextBody(body: unknown, contentType: unknown): string | undefined {
		const maxDecodedBytes = 64 * 1024;
		if (!(body instanceof ArrayBuffer || ArrayBuffer.isView(body)) || body.byteLength > maxDecodedBytes) {
			return undefined;
		}

		if (!this.isTextContentType(contentType)) {
			return undefined;
		}

		const bytes = ArrayBuffer.isView(body)
			? new Uint8Array(body.buffer, body.byteOffset, body.byteLength)
			: new Uint8Array(body);
		try {
			return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
		} catch {
			// Not valid UTF-8 despite the content type, so it is summarized like other binary data.
			return undefined;
		}
	}

	private static isTextContentType(contentType: unknown): boolean {
		if (typeof contentType !== 'string') {
			return false;
		}

		const lower = contentType.toLowerCase();

		return lower.startsWith('text/') || lower.includes('json') || lower.includes('xml');
	}

	// Error responses can be whole HTML pages.
	private static truncateText(value: unknown): unknown {
		const maxLength = 1000;
		if (typeof value !== 'string' || value.length <= maxLength) {
			return value;
		}

		return `${value.slice(0, maxLength)}... [truncated ${value.length - maxLength} characters]`;
	}

	// A loop instead of a regular expression: /\/+$/ backtracks on input with many slashes (polynomial runtime).
	private static trimSlashes(value: string, side: 'start' | 'end'): string {
		let start = 0;
		let end = value.length;
		while (side === 'start' && start < end && value[start] === '/') {
			start += 1;
		}
		while (side === 'end' && end > start && value[end - 1] === '/') {
			end -= 1;
		}

		return value.slice(start, end);
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
