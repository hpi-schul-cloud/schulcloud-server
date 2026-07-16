import { type EntityId } from '@shared/domain/types';
import { type OauthSessionToken } from '../domain';

export interface OauthSessionTokenRepo {
	save(domainObject: OauthSessionToken): Promise<void>;
	delete(domainObject: OauthSessionToken): Promise<void>;
	findLatestByUserId(userId: EntityId): Promise<OauthSessionToken | null>;
}

export const OAUTH_SESSION_TOKEN_REPO = 'OAUTH_SESSION_TOKEN_REPO';
