import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { Inject } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { OauthSessionToken } from '../domain';
import { OAUTH_SESSION_TOKEN_REPO, OauthSessionTokenRepo } from '../repo';

export class OauthSessionTokenService {
	constructor(
		@Inject(OAUTH_SESSION_TOKEN_REPO) private readonly oauthSessionTokenRepo: OauthSessionTokenRepo,
		@Inject(DefaultEncryptionService) private readonly encryptionService: EncryptionService
	) {}

	public async save(domainObject: OauthSessionToken): Promise<void> {
		domainObject.refreshToken = this.encryptionService.encrypt(domainObject.refreshToken);
		await this.oauthSessionTokenRepo.save(domainObject);
	}

	public async delete(domainObject: OauthSessionToken): Promise<void> {
		await this.oauthSessionTokenRepo.delete(domainObject);
	}

	public async findLatestByUserId(userId: EntityId): Promise<OauthSessionToken | null> {
		const oauthSessionToken = await this.oauthSessionTokenRepo.findLatestByUserId(userId);

		if (oauthSessionToken?.refreshToken) {
			oauthSessionToken.refreshToken = this.encryptionService.decrypt(oauthSessionToken?.refreshToken);
		}

		return oauthSessionToken;
	}
}
