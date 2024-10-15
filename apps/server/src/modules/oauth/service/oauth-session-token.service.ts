import { Inject } from '@nestjs/common';
import { OauthSessionToken } from '../domain';
import { OAUTH_SESSION_TOKEN_REPO, OauthSessionTokenRepo } from '../repo';

export class OauthSessionTokenService {
	constructor(@Inject(OAUTH_SESSION_TOKEN_REPO) private readonly oauthSessionTokenRepo: OauthSessionTokenRepo) {}

	async save(domainObject: OauthSessionToken): Promise<OauthSessionToken> {
		const oauthSessionToken: OauthSessionToken = await this.oauthSessionTokenRepo.save(domainObject);

		return oauthSessionToken;
	}
}
