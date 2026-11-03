import { SecretRegistry } from '@infra/configuration';
import winston from 'winston';

// winston stores the finished log line under this symbol (MESSAGE from triple-beam)
const MESSAGE = Symbol.for('message');
const MASK = '***';
const BASIC_AUTH = /\bBasic\s+([A-Za-z0-9+/]+={0,2})/g;

let cachedVersion = -1;
let cachedPattern: RegExp | undefined;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

// Matches each secret as it is and as it appears inside a JSON string (quotes or backslashes escaped).
const getSecretPattern = (): RegExp | undefined => {
	if (cachedVersion !== SecretRegistry.getVersion()) {
		const variants = new Set<string>();
		for (const secret of SecretRegistry.getSecrets()) {
			variants.add(secret);
			variants.add(JSON.stringify(secret).slice(1, -1));
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
	text.replace(BASIC_AUTH, (match, encoded: string) =>
		containsSecret(Buffer.from(encoded, 'base64').toString('utf8')) ? `Basic ${MASK}` : match
	);

export const maskSecretsInText = (text: string): string => {
	const pattern = getSecretPattern();
	if (!pattern) {
		return text;
	}

	return maskBasicAuth(text).replace(pattern, MASK);
};

/**
 * Masks the values of config properties marked with @Secret() in the finished log line.
 * Must be the last format, so it covers everything that ends up in the line.
 */
export const maskSecrets = winston.format((info) => {
	const record = info as unknown as Record<symbol, unknown>;
	const line = record[MESSAGE];
	if (typeof line === 'string') {
		record[MESSAGE] = maskSecretsInText(line);
	}

	return info;
});
