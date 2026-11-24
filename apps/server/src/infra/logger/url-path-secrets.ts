// This file is also required by the legacy Feathers app from dist (src/middleware/errorHandler.js, src/app.js).
// Keep it free of path aliases and Nest imports, so it works there without the Nest module system.

const REDACTED = '***';

interface SecretPathRoute {
	/** Path segments in front of the secret, e.g. "sharetoken" for /sharetoken/:token. */
	prefix: string;
	/** Names of the route params that hold the secret, as Nest puts them into request.params. */
	params: string[];
	/** Segments after the prefix that are other routes, not a secret (e.g. /passwordRecovery/reset). */
	notSecret?: string[];
	/** The secret may contain "/", so everything up to the query string is redacted. */
	spansSlashes?: boolean;
}

/**
 * Routes that carry a credential in the URL path. Whoever knows the value can use it,
 * so it must not end up in logs. Add new routes here.
 */
const SECRET_PATH_ROUTES: SecretPathRoute[] = [
	// Nest: GET /sharetoken/:token, POST /sharetoken/:token/import. Whoever has the token can import the shared course or board.
	{ prefix: 'sharetoken', params: ['token'] },
	// Nest: GET /registrations/by-secret/:registrationSecret(/complete). The secret lets the holder complete a registration.
	{ prefix: 'registrations/by-secret', params: ['registrationSecret'] },
	// Nest: GET /authorization/resolve-token/:token/ttl/:tokenTtlInSeconds. The token is an access token for external services.
	{ prefix: 'authorization/resolve-token', params: ['token'] },
	// Nest: POST /room-invitation-links/:roomInvitationLinkId joins a room. The link id is what the invitation link shares.
	{ prefix: 'room-invitation-links', params: ['roomInvitationLinkId'] },
	// Feathers: GET /passwordRecovery/:token. The token is the one sent by mail to reset a password.
	{ prefix: 'passwordRecovery', params: [], notSecret: ['reset', 'api'] },
	// Feathers: GET /users/linkImport/:importHash. The import hash lets the holder register as that user.
	{ prefix: 'users/linkImport', params: [], spansSlashes: true },
	// Feathers: GET /link/:id redirects to its target, e.g. a registration link with an import hash.
	{ prefix: 'link', params: [], notSecret: ['api'] },
];

// The same route is reached under several mount paths: Nest under /api/v3 (request.url inside Nest has no prefix),
// Feathers under /, /api, /api/v1 and /legacy/v1 (see server.app.ts and legacyForward.js).
const MOUNT_PREFIX = String.raw`(?:/api(?:/v\d+)?)?(?:/legacy/v1)?`;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

const toPattern = (route: SecretPathRoute): RegExp => {
	const notSecret = route.notSecret?.length ? `(?!(?:${route.notSecret.map(escapeRegExp).join('|')})(?:[/?#]|$))` : '';
	const secret = route.spansSlashes ? '[^?#]+' : '[^/?#]+';

	// Express routes are case-insensitive, so /ShareToken/abc reaches the same handler.
	return new RegExp(`^(${MOUNT_PREFIX}/${escapeRegExp(route.prefix)}/)${notSecret}${secret}`, 'i');
};

const SECRET_PATH_PATTERNS = SECRET_PATH_ROUTES.map(toPattern);

const SECRET_PARAM_NAMES = new Set(SECRET_PATH_ROUTES.flatMap((route) => route.params));

/** Replaces secrets in the path of a URL (e.g. /sharetoken/abc becomes /sharetoken/***). Other URLs stay unchanged. */
export const redactSecretsInUrlPath = <T>(url: T): T => {
	if (typeof url !== 'string') {
		return url;
	}

	return SECRET_PATH_PATTERNS.reduce(
		(redacted, pattern) => redacted.replace(pattern, `$1${REDACTED}`),
		url as string
	) as T;
};

/** Returns a copy of the route params where params that hold a secret path segment are redacted. */
export const redactSecretPathParams = <T>(params: T): T => {
	if (typeof params !== 'object' || params === null) {
		return params;
	}

	const redacted = { ...params } as Record<string, unknown>;
	for (const key of Object.keys(redacted)) {
		if (SECRET_PARAM_NAMES.has(key)) {
			redacted[key] = REDACTED;
		}
	}

	return redacted as T;
};
