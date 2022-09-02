import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { OauthConfig } from '@shared/domain';
import { OauthTokenResponse } from '@src/modules/oauth/controller/dto/oauth-token.response';
import { SymetricKeyEncryptionService } from '@shared/infra/encryption';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { AuthorizationParams } from '../controller/dto/authorization.params';
import { OAuthService } from '../service/oauth.service';

@Injectable()
export class HydraOauthUc {
	constructor(private readonly oauthService: OAuthService, private logger: Logger) {
		this.logger.setContext(HydraOauthUc.name);
	}

	hydraNextcloudOauthConfig: OauthConfig = new OauthConfig({
		authEndpoint: '',
		clientId: Configuration.get('NEXTCLOUD_CLIENT_ID') as string,
		clientSecret: Configuration.get('NEXTCLOUD_CLIENT_SECRET') as string,
		grantType: 'authorization_code',
		issuer: `${Configuration.get('HYDRA_URI') as string}/`,
		jwksEndpoint: `${Configuration.get('HYDRA_URI') as string}/.well-known/jwks.json`,
		logoutEndpoint: `${Configuration.get('HYDRA_URI') as string}/oauth2/sessions/logout`,
		provider: 'hydra',
		redirectUri: `${Configuration.get('API_HOST') as string}/v3/sso/hydra`,
		responseType: 'id_token',
		scope: '',
		tokenEndpoint: `${Configuration.get('HYDRA_URI') as string}/oauth2/token`,
	});

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
