// Matched anywhere in the lower-cased name: searchUserPassword, password_new, clientCredentials.
const CREDENTIAL_NAME_PARTS = ['password', 'passwort', 'passwd', 'credential'];

// Matched anywhere in the lower-cased name: x-auth-token, clientSecret, set-cookie.
const OTHER_SENSITIVE_NAME_PARTS = ['cookie', 'auth', 'token', 'secret'];

// One-time tokens under neutral names, compared without case, _ and -:
// resetId is the password recovery token (POST /passwordRecovery/reset),
// importHash lets anyone with it finish the registration of an imported user.
const ONE_TIME_TOKEN_NAMES = new Set(['resetid', 'importhash']);

const isUpper = (char: string | undefined): boolean => char !== undefined && char >= 'A' && char <= 'Z';
const isLower = (char: string | undefined): boolean => char !== undefined && char >= 'a' && char <= 'z';

// End of the word that starts with an upper-case run at runStart and ends before runEnd.
// "PINCode": the last upper-case letter starts the next word (PIN, Code); "userPINs": a trailing plural s stays (PINs).
const getUpperCaseWordEnd = (name: string, runStart: number, runEnd: number): number => {
	if (!isLower(name[runEnd])) {
		return runEnd;
	}
	if (name[runEnd] === 's' && !isLower(name[runEnd + 1])) {
		return runEnd + 1;
	}

	return runEnd - runStart > 1 ? runEnd - 1 : runEnd;
};

/**
 * Words of a name split at camelCase, digits, _, - and other characters
 * ("userPINCode" -> user, PIN, Code; "userPINs" -> user, PINs).
 * One pass over the characters: field names come from request bodies, a backtracking regular expression
 * could take quadratic time on crafted names.
 */
const getWords = (name: string): string[] => {
	const words: string[] = [];
	let index = 0;
	while (index < name.length) {
		const start = index;
		if (isUpper(name[index])) {
			while (isUpper(name[index])) {
				index += 1;
			}
			index = getUpperCaseWordEnd(name, start, index);
		}
		while (isLower(name[index])) {
			index += 1;
		}
		if (index === start) {
			// Not a letter: a separator.
			index += 1;
		} else {
			words.push(name.slice(start, index).toLowerCase());
		}
	}

	return words;
};

/**
 * Names of passwords, credentials, PINs and one-time tokens. Their values are redacted completely,
 * because even a few characters of a password or PIN help to guess it.
 */
export const isCredentialName = (name: string): boolean => {
	const lower = name.toLowerCase();

	return (
		CREDENTIAL_NAME_PARTS.some((part) => lower.includes(part)) ||
		ONE_TIME_TOKEN_NAMES.has(lower.replace(/[-_]/g, '')) ||
		// Only as a word of its own (pin, userPins, PIN_CODE, x-pin), not inside pinned, spinner or shipping
		(lower.includes('pin') && getWords(name).some((word) => word === 'pin' || word === 'pins'))
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

// Query param names: the sensitive names plus those of presigned S3 URLs (X-Amz-Signature, AWSAccessKeyId),
// which carry a working signature and the access key id; the URL could be used until it expires.
export const isSensitiveQueryParamName = (name: string): boolean => {
	const lower = name.toLowerCase();

	// The original name, not lower: the pin rule splits camelCase words (userPin, pinCode).
	return isSensitiveName(name) || lower.includes('signature') || lower.includes('awsaccesskeyid');
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
