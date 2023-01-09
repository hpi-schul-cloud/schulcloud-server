import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { SystemService } from '@src/modules/system/service/system.service';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { FeathersJwtProvider } from '@src/modules/authorization';
import { OAuthService } from '../service/oauth.service';
import { OAuthResponse } from '../service/dto/oauth.response';
import { AuthorizationParams } from '../controller/dto/authorization.params';

/**
 * @deprecated remove after login via oauth moved to authentication module
 */
@Injectable()
export class OauthUc {
	constructor(
		private readonly oauthService: OAuthService,
		private readonly feathersJwtProvider: FeathersJwtProvider,
		private readonly systemService: SystemService,
		private logger: Logger
	) {
		this.logger.setContext(OauthUc.name);
	}

	async processOAuth(query: AuthorizationParams, systemId: string): Promise<OAuthResponse> {
		try {
			const oAuthResponsePromise = this.process(query, systemId);
			return await oAuthResponsePromise;
		} catch (error) {
			return await this.getOauthErrorResponse(error, systemId);
		}
	}

	private async process(query: AuthorizationParams, systemId: string): Promise<OAuthResponse> {
		this.logger.debug(`Oauth process started for systemId ${systemId}`);

		const authCode: string = this.oauthService.checkAuthorizationCode(query);

		const { user, redirect }: { user: UserDO; redirect: string } = await this.oauthService.authenticateUser(
			authCode,
			systemId
		);

		if (!user.id) {
			// unreachable. Users from DB have an ID
			throw new UnauthorizedException();
		}
		const jwtResponse: string = await this.feathersJwtProvider.generateJwt(user.id);

		const response: OAuthResponse = new OAuthResponse();
		response.jwt = jwtResponse;
		response.redirect = redirect;
		return response;
	}

	private async getOauthErrorResponse(error, systemId: string): Promise<OAuthResponse> {
		const system = await this.systemService.findOAuthById(systemId);
		const provider = system?.oauthConfig ? system.oauthConfig.provider : 'unknown-provider';
		const oAuthError = this.oauthService.getOAuthErrorResponse(error, provider);
		return oAuthError;
	}
}
