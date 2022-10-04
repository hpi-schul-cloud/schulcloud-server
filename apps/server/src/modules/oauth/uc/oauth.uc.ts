import { Injectable, NotFoundException } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { System, User } from '@shared/domain';
import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';
import { OauthTokenResponse } from '@src/modules/oauth/controller/dto';
import { SystemRepo } from '@shared/repo';
import { OAuthService } from '../service/oauth.service';
import { OAuthResponse } from '../service/dto/oauth.response';
import { AuthorizationParams } from '../controller/dto/authorization.params';

@Injectable()
export class OauthUc {
	constructor(
		private readonly oauthService: OAuthService,
		private readonly systemRepo: SystemRepo,
		private logger: Logger
	) {
		this.logger.setContext(OauthUc.name);
	}

	private async getOauthResponse(error, systemId: string): Promise<OAuthResponse> {
		const system: System = await this.systemRepo.findById(systemId);
		const provider = system.oauthConfig ? system.oauthConfig.provider : 'unknown-provider';
		const oAuthError = this.oauthService.getOAuthError(error, provider);
		return oAuthError;
	}

	async processOAuth(query: AuthorizationParams, systemId: string): Promise<OAuthResponse> {
		try {
			this.logger.debug(`Oauth process started for systemId ${systemId}`);

			const authCode: string = this.oauthService.checkAuthorizationCode(query);

			const system: System = await this.systemRepo.findById(systemId);
			const { oauthConfig } = system;
			if (oauthConfig == null) {
				this.logger.warn(
					`SSO Oauth process couldn't be started, because of missing oauthConfig of system: ${system.id}`
				);
				throw new OAuthSSOError('Requested system has no oauth configured', 'sso_internal_error');
			}

			const queryToken: OauthTokenResponse = await this.oauthService.requestToken(authCode, oauthConfig);

			await this.oauthService.validateToken(queryToken.id_token, oauthConfig);

			const user: User = await this.oauthService.findUser(queryToken.access_token, queryToken.id_token, system.id);

			const jwtResponse: string = await this.oauthService.getJwtForUser(user);

			const response: OAuthResponse = this.oauthService.buildResponse(oauthConfig, queryToken);
			response.redirect = this.oauthService.getRedirectUrl(
				response.provider,
				response.idToken,
				response.logoutEndpoint
			);
			response.jwt = jwtResponse;

			return response;
		} catch (error) {
			return await this.getOauthResponse(error, systemId);
		}
	}
}
