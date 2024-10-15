import { OauthSessionToken } from '../domain';

export interface OauthSessionTokenRepo {
	save(domainObject: OauthSessionToken): Promise<OauthSessionToken>;
}

export const OAUTH_SESSION_TOKEN_REPO = 'OAUTH_SESSION_TOKEN_REPO';
