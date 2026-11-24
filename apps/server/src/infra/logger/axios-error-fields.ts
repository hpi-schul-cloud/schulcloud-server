import { type AxiosError } from 'axios';
import { isSensitiveName } from './sensitive-value';

export interface AxiosErrorFields {
	code?: string;
	status?: number;
	statusText?: string;
	method?: string;
	url?: string;
	responseData: unknown;
}

// Presigned S3 URLs carry a working signature and the access key id; the URL could be used until it expires.
const isSensitiveQueryParamName = (name: string): boolean => {
	const lower = name.toLowerCase();

	return (
		isSensitiveName(lower) ||
		lower.includes('signature') ||
		lower.includes('credential') ||
		lower.includes('awsaccesskeyid')
	);
};

// A loop instead of a regular expression: /\/+$/ backtracks on input with many slashes (polynomial runtime).
const trimSlashes = (value: string, side: 'start' | 'end'): string => {
	let start = 0;
	let end = value.length;
	while (side === 'start' && start < end && value[start] === '/') {
		start += 1;
	}
	while (side === 'end' && end > start && value[end - 1] === '/') {
		end -= 1;
	}

	return value.slice(start, end);
};

/**
 * Removes credentials and the values of sensitive query parameters from a request URL.
 * A relative URL is resolved against its base URL like axios does.
 */
const redactUrl = (url: string | undefined, baseUrl: string | undefined): string | undefined => {
	if (!url) {
		return url;
	}

	// Like axios: a relative url is appended to the base url including its path (/api + /token = /api/token).
	const isAbsoluteUrl = /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
	const fullUrl = baseUrl && !isAbsoluteUrl ? `${trimSlashes(baseUrl, 'end')}/${trimSlashes(url, 'start')}` : url;

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
		if (isSensitiveQueryParamName(name)) {
			parsedUrl.searchParams.set(name, 'REDACTED_VALUE');
		}
	}

	const redactedUrl = isRelativeWithoutBase
		? `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`
		: parsedUrl.toString();

	return redactedUrl.replaceAll('REDACTED_VALUE', '[REDACTED]');
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

// Plain objects and AxiosHeaders (which keeps headers as own properties); header names are case-insensitive.
const getContentType = (headers: unknown): unknown => {
	if (!isRecord(headers)) {
		return undefined;
	}

	const name = Object.keys(headers).find((key) => key.toLowerCase() === 'content-type');

	return name ? headers[name] : undefined;
};

const isTextContentType = (contentType: unknown): boolean => {
	if (typeof contentType !== 'string') {
		return false;
	}

	const lower = contentType.toLowerCase();

	return lower.startsWith('text/') || lower.includes('json') || lower.includes('xml');
};

const decodeTextBody = (body: unknown, contentType: unknown): string | undefined => {
	const maxDecodedBytes = 64 * 1024;
	if (!(body instanceof ArrayBuffer || ArrayBuffer.isView(body)) || body.byteLength > maxDecodedBytes) {
		return undefined;
	}

	if (!isTextContentType(contentType)) {
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
};

// Error responses can be whole HTML pages.
const truncateText = (value: unknown): unknown => {
	const maxLength = 1000;
	if (typeof value !== 'string' || value.length <= maxLength) {
		return value;
	}

	return `${value.slice(0, maxLength)}... [truncated ${value.length - maxLength} characters]`;
};

/**
 * Prepares the body of a failed response for logging, because external APIs explain their errors there.
 * Text is truncated. A text body received as binary (axios responseType 'arraybuffer') is decoded first.
 * Other binary bodies and streams are summarized later by the redaction.
 */
const prepareResponseBody = (body: unknown, headers: unknown): unknown =>
	truncateText(decodeTextBody(body, getContentType(headers)) ?? body);

/**
 * The only fields of an axios error that are logged. Axios errors carry the full request config
 * (headers, auth, body) with our credentials, so the error itself must never be logged.
 * The response body is NOT redacted here; LoggingUtils redacts it like any other value.
 */
export const getAxiosErrorFields = (error: AxiosError): AxiosErrorFields => {
	return {
		code: error.code,
		status: error.response?.status ?? error.status,
		statusText: error.response?.statusText,
		method: error.config?.method?.toUpperCase(),
		url: redactUrl(error.config?.url, error.config?.baseURL),
		responseData: prepareResponseBody(error.response?.data, error.response?.headers),
	};
};
