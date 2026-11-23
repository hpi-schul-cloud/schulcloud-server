import {
	ForbiddenException,
	Injectable,
	type MiddlewareConsumer,
	type NestMiddleware,
	RequestMethod,
} from '@nestjs/common';
import { JwtExtractor } from '@shared/common/utils/jwt';
import { type NextFunction, type Request, type Response } from 'express';
import { ExtractJwt } from 'passport-jwt';

const JWT_COOKIE_NAME = 'jwt';
const jwtFromCookie = JwtExtractor.fromCookie(JWT_COOKIE_NAME);
const jwtFromBearer = ExtractJwt.fromAuthHeaderAsBearerToken();

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * GETs that create or persist state. SameSite=Lax still sends the jwt cookie on a
 * cross-site top-level navigation, so these cannot be treated as ordinary reads.
 *
 * - collaborative-text-editor get-or-creates the editor and sets the Etherpad session cookie.
 * - tools/context/:id/launch may persist an LTI pseudonym via createLaunchRequest.
 */
const PROTECTED_GET_PATH =
	/^\/(?:api\/v3\/)?(?:collaborative-text-editor\/[^/]+\/[^/]+|tools\/context\/[^/]+\/launch)$/;

const SAME_ORIGIN_FETCH_SITES = new Set(['same-origin', 'none']);

export const COOKIE_CREDENTIAL_CSRF_MESSAGE = 'Cross-site cookie-credentialed request is forbidden';

/**
 * Rejects cookie-credentialed state-changing requests that are not same-origin.
 * A request is cookie-credentialed when a jwt cookie is present and Authorization: Bearer is absent.
 */
export function cookieCredentialCsrfMiddleware(request: Request, _response: Response, next: NextFunction): void {
	if (isCookieCredentialed(request) && isStateChanging(request) && !isTrustedBrowserRequest(request)) {
		throw new ForbiddenException(COOKIE_CREDENTIAL_CSRF_MESSAGE);
	}

	next();
}

@Injectable()
export class CookieCredentialCsrfMiddleware implements NestMiddleware {
	public use(request: Request, response: Response, next: NextFunction): void {
		cookieCredentialCsrfMiddleware(request, response, next);
	}
}

export function configureCookieCredentialCsrf(consumer: MiddlewareConsumer): void {
	consumer.apply(CookieCredentialCsrfMiddleware).forRoutes({ path: '{*splat}', method: RequestMethod.ALL });
}

function isCookieCredentialed(request: Request): boolean {
	const cookieJwt = jwtFromCookie(request);

	if (!cookieJwt) {
		return false;
	}

	return !jwtFromBearer(request);
}

function isStateChanging(request: Request): boolean {
	const method = request.method.toUpperCase();

	if (UNSAFE_METHODS.has(method)) {
		return true;
	}

	if (method !== 'GET') {
		return false;
	}

	return PROTECTED_GET_PATH.test(normalizePath(request.path || '/'));
}

function isTrustedBrowserRequest(request: Request): boolean {
	const fetchSite = headerValue(request, 'sec-fetch-site')?.toLowerCase();

	if (fetchSite) {
		return SAME_ORIGIN_FETCH_SITES.has(fetchSite);
	}

	const origin = headerValue(request, 'origin');

	if (origin) {
		return hasSameSchemeAndHost(request, origin);
	}

	const referer = headerValue(request, 'referer') ?? headerValue(request, 'referrer');

	if (referer) {
		return hasSameSchemeAndHost(request, referer);
	}

	return false;
}

function hasSameSchemeAndHost(request: Request, candidate: string): boolean {
	const candidateUrl = parseUrl(candidate);
	const target = requestTarget(request);

	if (!candidateUrl || !target) {
		return false;
	}

	return candidateUrl.protocol === target.protocol && candidateUrl.host === target.host;
}

function requestTarget(request: Request): URL | undefined {
	const host = request.get('host')?.trim();

	if (!host) {
		return undefined;
	}

	return parseUrl(`${request.protocol}://${host}`);
}

function parseUrl(value: string): URL | undefined {
	try {
		return new URL(value);
	} catch {
		return undefined;
	}
}

function headerValue(request: Request, name: string): string | undefined {
	const value = request.get(name);

	if (typeof value !== 'string') {
		return undefined;
	}

	const trimmed = value.trim();

	return trimmed.length > 0 ? trimmed : undefined;
}

function normalizePath(path: string): string {
	const withoutQuery = path.split('?')[0] ?? '/';
	const withLeadingSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;

	if (withLeadingSlash.length > 1) {
		return withLeadingSlash.replace(/\/+$/, '');
	}

	return withLeadingSlash;
}
