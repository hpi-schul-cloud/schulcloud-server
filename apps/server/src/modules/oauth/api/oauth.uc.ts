import { Inject, Injectable } from '@nestjs/common';
import { FeatureDisabledLoggableException, NotFoundLoggableException } from '@shared/common/loggable-exception';
import { EntityId } from '@shared/domain/types';
import { OauthSessionToken } from '../domain';
import { OAUTH_PUBLIC_API_CONFIG_TOKEN, OauthPublicApiConfig } from '../oauth.config';
import { OauthSessionTokenService } from '../service';

@Injectable()
export class OAuthUc {
	constructor(
		private readonly oauthSessionTokenService: OauthSessionTokenService,
		@Inject(OAUTH_PUBLIC_API_CONFIG_TOKEN)
		private readonly config: OauthPublicApiConfig
	) {}

	public async getLatestSessionTokenByUser(userId: EntityId): Promise<OauthSessionToken> {
		if (!this.config.featureExternalSystemLogoutEnabled) {
			throw new FeatureDisabledLoggableException('FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED');
		}

		const sessionToken: OauthSessionToken | null = await this.oauthSessionTokenService.findLatestByUserId(userId);

		if (!sessionToken) {
			throw new NotFoundLoggableException(OauthSessionToken.name, { userId: userId });
		}

		return sessionToken;
	}
}
