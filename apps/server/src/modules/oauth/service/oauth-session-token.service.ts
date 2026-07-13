import { Inject } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { OauthSessionToken } from '../domain';
import { OAUTH_SESSION_TOKEN_REPO, OauthSessionTokenRepo } from '../repo';

export class OauthSessionTokenService {
	constructor(@Inject(OAUTH_SESSION_TOKEN_REPO) private readonly oauthSessionTokenRepo: OauthSessionTokenRepo) {}

	public async save(domainObject: OauthSessionToken): Promise<void> {
		await this.oauthSessionTokenRepo.save(domainObject);
	}

	public async delete(domainObject: OauthSessionToken): Promise<void> {
		await this.oauthSessionTokenRepo.delete(domainObject);
	}

	public async findLatestByUserId(userId: EntityId): Promise<OauthSessionToken | null> {
		const oauthSessionToken = await this.oauthSessionTokenRepo.findLatestByUserId(userId);

		return oauthSessionToken;
	}
}
