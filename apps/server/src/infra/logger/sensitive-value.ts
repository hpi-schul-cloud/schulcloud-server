/**
 * Field, header and query parameter names whose values must not be logged.
 */
export const isSensitiveName = (name: string): boolean => {
	const lower = name.toLowerCase();

	return (
		lower.includes('cookie') ||
		lower.startsWith('x-api') ||
		lower.includes('auth') ||
		lower.includes('token') ||
		lower.includes('secret') ||
		// endsWith, so flags such as forcePasswordChange stay readable
		lower.endsWith('password') ||
		lower.endsWith('passwd') ||
		lower.endsWith('credential') ||
		lower.endsWith('credentials')
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
