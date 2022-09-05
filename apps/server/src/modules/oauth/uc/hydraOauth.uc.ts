import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { OauthTokenResponse } from '@src/modules/oauth/controller/dto/oauth-token.response';
import { HydraParams } from '@src/modules/oauth/controller/dto/hydra.params';
import { AuthorizationParams } from '../controller/dto/authorization.params';
import { OAuthService } from '../service/oauth.service';
import { HydraSsoService } from '../service/hydra.service';

@Injectable()
export class HydraOauthUc {
	constructor(
		private readonly oauthService: OAuthService,
		private readonly hydraSsoService: HydraSsoService,
		private logger: Logger
	) {
		this.logger.setContext(HydraOauthUc.name);
	}

	async getOauthToken(query: AuthorizationParams, ltiTool: HydraParams): Promise<OauthTokenResponse> {
		const hydraOauthConfig = this.hydraSsoService.generateConfig();
		this.logger.debug('Oauth process strated. Next up: checkAuthorizationCode().');
		const authCode: string = this.oauthService.checkAuthorizationCode(query);
		this.logger.debug('Done. Next up: requestToken().');
		const queryToken: OauthTokenResponse = await this.oauthService.requestToken(authCode, hydraOauthConfig);
		this.logger.debug('Done. Next up: validateToken().');
		await this.oauthService.validateToken(queryToken.id_token, hydraOauthConfig);
		return queryToken;
	}
}
