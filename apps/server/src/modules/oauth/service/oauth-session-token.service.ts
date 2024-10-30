import { Inject } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { SortOrder, SortOrderMap } from '@shared/domain/interface';
import { OauthSessionToken } from '../domain';
import { OauthSessionTokenEntity } from '../entity';
import { OAUTH_SESSION_TOKEN_REPO, OauthSessionTokenRepo } from '../repo';

export class OauthSessionTokenService {
	constructor(@Inject(OAUTH_SESSION_TOKEN_REPO) private readonly oauthSessionTokenRepo: OauthSessionTokenRepo) {}

	async save(domainObject: OauthSessionToken): Promise<OauthSessionToken> {
		const oauthSessionToken: OauthSessionToken = await this.oauthSessionTokenRepo.save(domainObject);

		return oauthSessionToken;
	}

	async findLatestByUserId(userId: EntityId): Promise<OauthSessionToken | null> {
		const sortByLatestUpdate: SortOrderMap<OauthSessionTokenEntity> = { updatedAt: SortOrder.desc };
		const oauthSessionToken: OauthSessionToken | null = await this.oauthSessionTokenRepo.findOneByUserId(
			userId,
			sortByLatestUpdate
		);

		return oauthSessionToken;
	}
}
