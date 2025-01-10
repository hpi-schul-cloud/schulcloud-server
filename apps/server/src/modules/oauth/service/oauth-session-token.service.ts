import { Inject } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { OauthSessionToken } from '../domain';
import { OAUTH_SESSION_TOKEN_REPO, OauthSessionTokenRepo } from '../repo';

export class OauthSessionTokenService {
	constructor(@Inject(OAUTH_SESSION_TOKEN_REPO) private readonly oauthSessionTokenRepo: OauthSessionTokenRepo) {}

	async save(domainObject: OauthSessionToken): Promise<OauthSessionToken> {
		const oauthSessionToken: OauthSessionToken = await this.oauthSessionTokenRepo.save(domainObject);

		return oauthSessionToken;
	}

	async delete(domainObject: OauthSessionToken): Promise<void> {
		await this.oauthSessionTokenRepo.delete(domainObject);
	}

	async findLatestByUserId(userId: EntityId): Promise<OauthSessionToken | null> {
		const oauthSessionToken: OauthSessionToken | null = await this.oauthSessionTokenRepo.findLatestByUserId(userId);

		return oauthSessionToken;
	}
}
