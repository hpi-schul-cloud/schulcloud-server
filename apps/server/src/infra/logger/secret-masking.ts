import { SecretRegistry } from '@infra/configuration';
import winston from 'winston';
import { summarizeOpaqueLogValue } from './opaque-log-value';

const MASK = '***';
// The scheme is case-insensitive (RFC 7617), so basic and BASIC are decoded as well.
const BASIC_AUTH = /\b(Basic)\s+([A-Z0-9+/]+={0,2})/gi;

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

const maskSecretsInText = (text: string): string => {
	const pattern = getSecretPattern();

	return pattern ? maskBasicAuth(text).replace(pattern, MASK) : text;
};

const maskSecretsInValue = (value: unknown, copies: WeakMap<object, unknown>): unknown => {
	if (typeof value === 'string') {
		return maskSecretsInText(value);
	}

	// A number field equal to a numeric secret becomes the string "***", so the line stays valid JSON.
	if (typeof value === 'number' || typeof value === 'bigint') {
		return containsSecret(String(value)) ? MASK : value;
	}

	if (typeof value !== 'object' || value === null || value instanceof Date) {
		return value;
	}

	const summary = summarizeOpaqueLogValue(value);
	if (summary !== undefined) {
		return summary;
	}

	// An object referenced twice (or circularly) gets the same masked copy, never the unmasked original.
	if (copies.has(value)) {
		return copies.get(value);
	}

	if (Array.isArray(value)) {
		const maskedArray: unknown[] = [];
		copies.set(value, maskedArray);
		for (const item of value) {
			maskedArray.push(maskSecretsInValue(item, copies));
		}

		return maskedArray;
	}

	const maskedRecord: Record<string, unknown> = {};
	copies.set(value, maskedRecord);
	for (const [key, item] of Object.entries(value)) {
		// defineProperty instead of maskedRecord[key]: a key "__proto__" (e.g. from parsed JSON) would set the prototype.
		Object.defineProperty(maskedRecord, maskSecretsInText(key), {
			value: maskSecretsInValue(item, copies),
			enumerable: true,
			writable: true,
			configurable: true,
		});
	}

	return maskedRecord;
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

	const copies = new WeakMap<object, unknown>();
	const record = info as Record<string, unknown>;
	for (const key of Object.keys(record)) {
		record[key] = maskSecretsInValue(record[key], copies);
	}

	return info;
});
