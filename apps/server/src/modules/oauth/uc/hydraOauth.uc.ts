import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { OauthConfig } from '@shared/domain';
import { OauthTokenResponse } from '@src/modules/oauth/controller/dto/oauth-token.response';
import { SymetricKeyEncryptionService } from '@shared/infra/encryption';
import { AuthorizationParams } from '../controller/dto/authorization.params';
import { OAuthService } from '../service/oauth.service';

@Injectable()
export class HydraOauthUc {
	constructor(
		private readonly oauthService: OAuthService,
		private readonly oAuthEncryptionService: SymetricKeyEncryptionService,
		private logger: Logger
	) {
		this.logger.setContext(HydraOauthUc.name);
	}

	hydraNextcloudOauthConfig: OauthConfig = new OauthConfig({
		authEndpoint: 'https://oauth-nbc-n21-266-oidc-token-poc.cd.dbildungscloud.dev/oauth2/auth',
		clientId: 'Nextcloud',
		clientSecret: 'Nextcloud',
		grantType: 'authorization_code',
		issuer: 'https://oauth-nbc-n21-266-oidc-token-poc.cd.dbildungscloud.dev/',
		jwksEndpoint: 'https://oauth-nbc-n21-266-oidc-token-poc.cd.dbildungscloud.dev/.well-known/jwks.json',
		logoutEndpoint: 'https://oauth-nbc-n21-266-oidc-token-poc.cd.dbildungscloud.dev/oauth2/sessions/logout',
		provider: 'hydra',
		redirectUri: 'http://api-svc:3030/api/v3/sso/hydra',
		responseType: 'id_token',
		scope: 'openid offline profile email groups',
		tokenEndpoint: 'https://oauth-nbc-n21-266-oidc-token-poc.cd.dbildungscloud.dev/oauth2/token',
	});

	async requestAuthCode(userId: string): Promise<AuthorizationParams> {
		return this.oauthService.requestAuthToken(this.hydraNextcloudOauthConfig, userId);
	}

	async getOauthToken(query: AuthorizationParams): Promise<OauthTokenResponse> {
		this.logger.debug('Oauth process strated. Next up: checkAuthorizationCode().');
		const authCode: string = this.oauthService.checkAuthorizationCode(query);
		this.logger.debug('Done. Next up: requestToken().');
		const queryToken: OauthTokenResponse = await this.oauthService.requestToken(
			authCode,
			this.hydraNextcloudOauthConfig
		);
		this.logger.debug('Done. Next up: validateToken().');
		await this.oauthService.validateToken(queryToken.id_token, this.hydraNextcloudOauthConfig);
		return queryToken;
	}
}
