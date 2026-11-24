// This file is also required by the legacy Feathers app from dist (src/middleware/errorHandler.js, src/app.js).
// Keep it free of path aliases and Nest imports, so it works there without the Nest module system.
import { isSensitiveName } from './sensitive-value';

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
	// The hash can contain "/" (bcrypt output, see UserLinkImportService.get), so the rest of the path is redacted.
	{ prefix: 'users/linkImport', params: [], spansSlashes: true },
	// Feathers: GET /link/:id redirects to its target, e.g. a registration link with an import hash.
	{ prefix: 'link', params: [], notSecret: ['api'] },
];

/**
 * Query params that carry a credential although their name does not say so.
 * Query params with a sensitive name (accessToken, shareToken, ...; see isSensitiveName) are redacted as well.
 */
const SECRET_QUERY_PARAMS = [
	// Nest: DELETE /room-invitation-links?roomInvitationLinkIds=... The same ids as in the path above.
	'roomInvitationLinkIds',
	// Feathers: GET /registrationPins?pin=... The registration pin confirms a registration (see registrationPins hooks).
	'pin',
];

// Characters that end a URL in free text: whitespace, quotes, the backslash of a JSON escape (\n, \") and
// punctuation around a URL (brackets, comma, semicolon, pipe).
const STOP = String.raw`\s"'\x60\\<>()\[\]{},;|^`;

// The same route is reached under several mount paths: Nest under /api/v3, Feathers under /, /api, /api/v1 and
// /legacy/v1 (see server.app.ts and legacyForward.js). Express also routes /api/v3//sharetoken/x, so slashes may repeat.
// A request target can also be in absolute form (GET http://host/path, RFC 9112), Express routes it by its path.
// Scheme and host have an upper length, so a long run of scheme characters costs linear, not quadratic time.
const MOUNT_PREFIX = String.raw`(?:[a-z][a-z0-9+.-]{0,20}://[^/?#${STOP}]{0,255})?(?:/+api(?:/+v\d+)?)?(?:/+legacy/+v1)?`;

// A URL starts where the text before it cannot be part of a path or a scheme (so /other/sharetoken/x is not matched),
// or right after a JSON escape like \n.
const URL_START = String.raw`(?:(?<=\\[nrt])|(?<![\w.~%/+-]))`;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

const toPathPattern = (route: SecretPathRoute): RegExp => {
	const prefix = route.prefix.split('/').map(escapeRegExp).join('/+');
	const secretStop = `?#${STOP}:&=`;
	const notSecret = route.notSecret?.length
		? `(?!(?:${route.notSecret.map(escapeRegExp).join('|')})(?:[/${secretStop}]|$))`
		: '';
	const secret = route.spansSlashes ? `[^${secretStop}]+` : `[^/${secretStop}]+`;

	// Express routes are case-insensitive, so /ShareToken/abc reaches the same handler.
	return new RegExp(`(${URL_START}${MOUNT_PREFIX}/+${prefix}/+)${notSecret}${secret}`, 'gi');
};

const SECRET_PATH_PATTERNS = SECRET_PATH_ROUTES.map(toPathPattern);

// name=value in a query string. The name may have the array forms of the qs parser: name[]=, name[0]=, name%5B0%5D=.
// Values end at the next & or # or a stop character.
const QUERY_PARAM_PATTERN = new RegExp(
	String.raw`([?&]([\w.-]{1,128})(?:\[[^\]?&#=${STOP}]{0,32}\]|%5B(?:(?!%5D)[^?&#=${STOP}]){0,32}%5D)*=)[^&#${STOP}]*`,
	'gi'
);

const SECRET_QUERY_PARAM_NAMES = new Set(SECRET_QUERY_PARAMS);

const isSecretQueryParam = (name: string): boolean => SECRET_QUERY_PARAM_NAMES.has(name) || isSensitiveName(name);

const SECRET_PARAM_NAMES = new Set(SECRET_PATH_ROUTES.flatMap((route) => route.params));

const redactKeys = <T>(record: T, names: Set<string>): T => {
	if (typeof record !== 'object' || record === null) {
		return record;
	}

	const redacted = { ...record } as Record<string, unknown>;
	for (const key of Object.keys(redacted)) {
		if (names.has(key)) {
			redacted[key] = REDACTED;
		}
	}

	return redacted as T;
};

/**
 * Replaces secrets of URLs anywhere in a text: a URL on its own, a message like "Cannot GET /sharetoken/abc",
 * or a finished JSON log line. Secret path segments (SECRET_PATH_ROUTES) and the values of secret query params
 * become ***. Only characters that are part of the secret are replaced, so a JSON line stays valid JSON.
 */
export const redactSecretsInText = <T>(text: T): T => {
	if (typeof text !== 'string') {
		return text;
	}

	const redactedPaths = SECRET_PATH_PATTERNS.reduce(
		(redacted, pattern) => redacted.replace(pattern, `$1${REDACTED}`),
		text as string
	);

	return redactedPaths.replace(QUERY_PARAM_PATTERN, (match: string, keep: string, name: string) =>
		isSecretQueryParam(name) ? `${keep}${REDACTED}` : match
	) as T;
};

/** Returns a copy of the route params where params that hold a secret path segment are redacted. */
export const redactSecretPathParams = <T>(params: T): T => redactKeys(params, SECRET_PARAM_NAMES);

/** Returns a copy of the parsed query where params that carry a secret are redacted (only SECRET_QUERY_PARAMS). */
export const redactSecretQueryParams = <T>(query: T): T => redactKeys(query, SECRET_QUERY_PARAM_NAMES);
