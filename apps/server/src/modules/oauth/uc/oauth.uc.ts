import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { OauthConfig, User } from '@shared/domain';
import { OauthTokenResponse } from '@src/modules/oauth/controller/dto/oauth-token.response';
import { IJwt } from '@src/modules/oauth/interface/jwt.base.interface';
import { OAuthService } from '../service/oauth.service';
import { OAuthResponse } from '../service/dto/oauth.response';
import { AuthorizationParams } from '../controller/dto/authorization.params';

@Injectable()
export class OauthUc {
	constructor(private readonly oauthService: OAuthService, private logger: Logger) {
		this.logger.setContext(OauthUc.name);
	}

	async processOAuth(query: AuthorizationParams, systemId: string): Promise<OAuthResponse> {
		try {
			const authCode: string = this.oauthService.checkAuthorizationCode(query);
			const oauthConfig: OauthConfig = await this.oauthService.getOauthConfig(systemId);
			const queryToken: OauthTokenResponse = await this.oauthService.requestToken(authCode, oauthConfig);
			const decodedToken: IJwt = await this.oauthService.validateToken(queryToken.id_token, oauthConfig);
			const user: User = await this.oauthService.findUser(decodedToken, oauthConfig, systemId);
			const jwtResponse: string = await this.oauthService.getJwtForUser(user);
			const response: OAuthResponse = this.oauthService.buildResponse(oauthConfig, queryToken);
			const oauthResponse: OAuthResponse = this.oauthService.getRedirect(response);
			oauthResponse.jwt = jwtResponse;
			return oauthResponse;
		} catch (error) {
			this.logger.log(error);
			const config: OauthConfig = await this.oauthService.getOauthConfig(systemId);
			return this.oauthService.getOAuthError(error, config.provider);
		}
	}
}
