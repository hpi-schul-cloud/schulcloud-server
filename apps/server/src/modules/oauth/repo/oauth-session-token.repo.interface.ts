import { EntityId } from '@shared/domain/types';
import { SortOrderMap } from '@shared/domain/interface';
import { OauthSessionToken } from '../domain';
import { OauthSessionTokenEntity } from '../entity';

export interface OauthSessionTokenRepo {
	save(domainObject: OauthSessionToken): Promise<OauthSessionToken>;
	findOneByUserId(
		userId: EntityId,
		sortOption?: SortOrderMap<OauthSessionTokenEntity>
	): Promise<OauthSessionToken | null>;
}

export const OAUTH_SESSION_TOKEN_REPO = 'OAUTH_SESSION_TOKEN_REPO';
