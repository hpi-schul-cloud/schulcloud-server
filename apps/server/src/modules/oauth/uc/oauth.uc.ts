import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { OauthConfig, System, User } from '@shared/domain';
import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';
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
			this.logger.debug('Oauth process strated. Next up: checkAuthorizationCode().');
			const authCode: string = this.oauthService.checkAuthorizationCode(query);
			this.logger.debug('Done. Next up: oauthService.getOauthConfig().');
			const oauthConfig: OauthConfig = await this.oauthService.getOauthConfig(systemId);
			this.logger.debug('Done. Next up: requestToken().');
			const queryToken: OauthTokenResponse = await this.oauthService.requestToken(authCode, oauthConfig);
			this.logger.debug('Done. Next up: validateToken().');
			const decodedToken: IJwt = await this.oauthService.validateToken(queryToken.id_token, oauthConfig);
			this.logger.debug('Done. Next up: findUser().');
			const user: User = await this.oauthService.findUser(decodedToken, oauthConfig, systemId);
			this.logger.debug('Done. Next up: getJWTForUser().');
			const jwtResponse: string = await this.oauthService.getJwtForUser(user);
			this.logger.debug('Done. Next up: buildResponse().');
			const response: OAuthResponse = this.oauthService.buildResponse(oauthConfig, queryToken);
			this.logger.debug('Done. Next up: getRedirect().');
			const oauthResponse: OAuthResponse = this.oauthService.getRedirect(response);
			this.logger.debug('Done. Response should now be returned().');
			oauthResponse.jwt = jwtResponse;
			return oauthResponse;
		} catch (error) {
			this.logger.log(error);
			const config: OauthConfig = await this.oauthService.getOauthConfig(systemId);
			return this.oauthService.getOAuthError(error, config.provider);
		}
	}
}
