import { SecretRegistry } from '@infra/configuration';
import winston from 'winston';

// winston stores the finished log line under this symbol (MESSAGE from triple-beam)
const MESSAGE = Symbol.for('message');
const MASK = '***';
// The scheme is case-insensitive (RFC 7617), so basic and BASIC are decoded as well.
const BASIC_AUTH = /\b(Basic)\s+([A-Za-z0-9+/]+={0,2})/gi;

let cachedVersion = -1;
let cachedPattern: RegExp | undefined;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

const lowerCaseHex = (encoded: string): string => encoded.replace(/%[0-9A-F]{2}/g, (hex) => hex.toLowerCase());

// Secrets end up in URLs (query parameters, form bodies), where characters like + / = are percent-encoded.
// encodeURIComponent and URLSearchParams encode slightly different characters, some clients use lower case hex.
const getUrlEncodedVariants = (secret: string): string[] => {
	const encoded = [encodeURIComponent(secret), new URLSearchParams({ v: secret }).toString().slice('v='.length)];

	return encoded.flatMap((value) => [value, lowerCaseHex(value)]);
};

// Matches each secret as it is, as it appears inside a JSON string (quotes or backslashes escaped) and URL-encoded.
const getSecretPattern = (): RegExp | undefined => {
	if (cachedVersion !== SecretRegistry.getVersion()) {
		const variants = new Set<string>();
		for (const secret of SecretRegistry.getSecrets()) {
			variants.add(secret);
			variants.add(JSON.stringify(secret).slice(1, -1));
			for (const encoded of getUrlEncodedVariants(secret)) {
				variants.add(encoded);
			}
		}

		const sortedVariants = [...variants].sort((a, b) => b.length - a.length);
		cachedPattern = sortedVariants.length ? new RegExp(sortedVariants.map(escapeRegExp).join('|'), 'g') : undefined;
		cachedVersion = SecretRegistry.getVersion();
	}

	return cachedPattern;
};

const containsSecret = (text: string): boolean =>
	[...SecretRegistry.getSecrets()].some((secret) => text.includes(secret));

// base64("user:secret") does not contain base64("secret"), so Basic auth values are decoded and checked.
const maskBasicAuth = (text: string): string =>
	text.replace(BASIC_AUTH, (match, scheme: string, encoded: string) =>
		containsSecret(Buffer.from(encoded, 'base64').toString('utf8')) ? `${scheme} ${MASK}` : match
	);

export const maskSecretsInText = (text: string): string => {
	const pattern = getSecretPattern();
	if (!pattern) {
		return text;
	}

	return maskBasicAuth(text).replace(pattern, MASK);
};

const maskSecretsInValue = (value: unknown, visited: WeakSet<object>): unknown => {
	if (typeof value === 'string') {
		return maskSecretsInText(value);
	}

	// A number field equal to a numeric secret becomes the string "***", so the line stays valid JSON.
	if (typeof value === 'number' || typeof value === 'bigint') {
		return containsSecret(String(value)) ? MASK : value;
	}

	if (typeof value !== 'object' || value === null || value instanceof Date || visited.has(value)) {
		return value;
	}

	visited.add(value);
	if (Array.isArray(value)) {
		return value.map((item) => maskSecretsInValue(item, visited));
	}

	return Object.fromEntries(
		Object.entries(value).map(([key, item]) => [maskSecretsInText(key), maskSecretsInValue(item, visited)])
	);
};

/**
 * Masks secret values in the fields of a log entry before it is serialized as JSON.
 * Masking the finished JSON line could break it, e.g. "count":*** for a numeric secret or a match inside an escape sequence.
 * Values are copied, the objects passed to the logger are not changed.
 */
export const maskSecretsInFields = winston.format((info) => {
	if (SecretRegistry.getSecrets().size === 0) {
		return info;
	}

	const visited = new WeakSet<object>();
	const record = info as Record<string, unknown>;
	for (const key of Object.keys(record)) {
		record[key] = maskSecretsInValue(record[key], visited);
	}

	return info;
});

/**
 * Masks the values of config properties marked with @Secret() in the finished log line of the pretty format.
 * Must be the last format, so it covers everything that ends up in the line. The JSON format uses maskSecretsInFields.
 */
export const maskSecrets = winston.format((info) => {
	const record = info as unknown as Record<symbol, unknown>;
	const line = record[MESSAGE];
	if (typeof line === 'string') {
		record[MESSAGE] = maskSecretsInText(line);
	}

	return info;
});
