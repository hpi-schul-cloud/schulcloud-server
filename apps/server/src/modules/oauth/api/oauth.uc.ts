import type { AuthenticationConfig } from '@modules/authentication';
import { OauthSessionToken, OauthSessionTokenService } from '@modules/oauth';
import { Injectable } from '@nestjs/common';
import { FeatureDisabledLoggableException, NotFoundLoggableException } from '@shared/common/loggable-exception';
import { EntityId } from '@shared/domain/types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OAuthUc {
	constructor(
		private readonly oauthSessionTokenService: OauthSessionTokenService,
		private readonly configService: ConfigService<AuthenticationConfig, true>
	) {}

	public async getLatestSessionTokenByUser(userId: EntityId): Promise<OauthSessionToken> {
		if (!this.configService.getOrThrow<boolean>('FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED')) {
			throw new FeatureDisabledLoggableException('FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED');
		}

		const sessionToken: OauthSessionToken | null = await this.oauthSessionTokenService.findLatestByUserId(userId);

		if (!sessionToken) {
			throw new NotFoundLoggableException(OauthSessionToken.name, { userId: userId });
		}

		return sessionToken;
	}
}
