// Matched anywhere in the lower-cased name: searchUserPassword, password_new, clientCredentials.
const CREDENTIAL_NAME_PARTS = ['password', 'passwort', 'passwd', 'credential'];

// Matched anywhere in the lower-cased name: x-auth-token, clientSecret, set-cookie.
const OTHER_SENSITIVE_NAME_PARTS = ['cookie', 'auth', 'token', 'secret'];

// Words of a name split at camelCase, digits, _ and - ("userPINCode" -> user, PIN, Code; "userPINs" -> user, PINs).
// Linear: each alternative fails after at most two backtracking steps.
const getWords = (name: string): string[] => {
	const words: string[] = name.match(/[A-Z]+s?(?![a-z])|[A-Z]?[a-z]+/g) ?? [];

	return words.map((word) => word.toLowerCase());
};

/**
 * Names of passwords, credentials and PINs. Their values are redacted completely,
 * because even a few characters of a password or PIN help to guess it.
 */
export const isCredentialName = (name: string): boolean => {
	const lower = name.toLowerCase();

	return (
		CREDENTIAL_NAME_PARTS.some((part) => lower.includes(part)) ||
		// Only as a word of its own (pin, userPins, PIN_CODE, x-pin), not inside pinned, spinner or shipping
		getWords(name).some((word) => word === 'pin' || word === 'pins')
	);
};

/**
 * Field, header and query parameter names whose values must not be logged.
 * Also used by the Feathers error handler (src/middleware/errorHandler.js) via the compiled dist file.
 */
export const isSensitiveName = (name: string): boolean => {
	const lower = name.toLowerCase();

	return (
		isCredentialName(name) ||
		OTHER_SENSITIVE_NAME_PARTS.some((part) => lower.includes(part)) ||
		lower.startsWith('x-api') ||
		// Only API keys: "key" alone would also hit accessKeyId, versionKey or public keys
		/api[-_]?key/.test(lower)
	);
};

const maskCredential = (value: string): string => {
	if (value.length <= 8) {
		return '[REDACTED]';
	}

	return `${value.slice(0, 4)}...${value.slice(-2)} [REDACTED]`;
};

/**
 * Keeps the first and last characters of a secret so that log lines can still be told apart.
 * An auth scheme in front of the secret ("Bearer ...", "Basic ...") stays readable.
 */
export const maskSecret = (secret: string): string => {
	const trimmedSecret = secret.trim();
	if (!trimmedSecret) {
		return '[REDACTED]';
	}

	// Already masked (e.g. an AxiosErrorLoggable inside another error is redacted twice); masking again would garble it.
	if (trimmedSecret.endsWith('[REDACTED]')) {
		return trimmedSecret;
	}

	const [scheme, credential, ...rest] = trimmedSecret.split(/\s+/);
	if (credential && rest.length === 0) {
		return `${scheme} ${maskCredential(credential)}`;
	}

	return maskCredential(trimmedSecret);
};
