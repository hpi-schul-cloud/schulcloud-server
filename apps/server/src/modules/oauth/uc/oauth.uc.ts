import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { System, User } from '@shared/domain';
import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';
import { OauthTokenResponse } from '@src/modules/oauth/controller/dto/oauth-token.response';
import { SystemRepo } from '@shared/repo';
import { AuthorizationParams } from '../controller/dto/authorization.params';
import { OAuthResponse } from '../service/dto/oauth.response';
import { OAuthService } from '../service/oauth.service';

@Injectable()
export class OauthUc {
	constructor(
		private readonly oauthService: OAuthService,
		private readonly systemRepo: SystemRepo,
		private logger: Logger
	) {
		this.logger.setContext(OauthUc.name);
	}

	async startOauth(query: AuthorizationParams, systemId: string): Promise<OAuthResponse> {
		this.logger.debug(`starting oauth process for system with id: ${systemId}`);
		const promise: Promise<OAuthResponse> = this.oauthService.processOAuth(query, systemId);
		return promise;
	}

	// async processOAuth(query: AuthorizationParams, systemId: string): Promise<OAuthResponse> {
	// 	try {
	// 		this.logger.debug('Oauth process strated. Next up: checkAuthorizationCode().');
	// 		const authCode: string = this.oauthService.checkAuthorizationCode(query);
	//
	// 		this.logger.debug('Done. Next up: systemRepo.findById().');
	// 		const system: System = await this.systemRepo.findById(systemId);
	//
	// 		this.logger.debug('Done. Next up: oauthConfig check.');
	// 		const { oauthConfig } = system;
	//
	// 		if (oauthConfig == null) {
	// 			this.logger.error(
	// 				`SSO Oauth process couldn't be started, because of missing oauthConfig of system: ${system.id}`
	// 			);
	// 			throw new OAuthSSOError('Requested system has no oauth configured', 'sso_internal_error');
	// 		}
	// 		this.logger.debug('Done. Next up: requestToken().');
	// 		const queryToken: OauthTokenResponse = await this.oauthService.requestToken(authCode, oauthConfig);
	//
	// 		this.logger.debug('Done. Next up: validateToken().');
	// 		await this.oauthService.validateToken(queryToken.id_token, oauthConfig);
	//
	// 		this.logger.debug('Done. Next up: findUser().');
	// 		const user: User = await this.oauthService.findUser(queryToken.access_token, queryToken.id_token, system.id);
	//
	// 		this.logger.debug('Done. Next up: getJWTForUser().');
	// 		const jwtResponse: string = await this.oauthService.getJwtForUser(user);
	//
	// 		this.logger.debug('Done. Next up: buildResponse().');
	// 		const response: OAuthResponse = this.oauthService.buildResponse(oauthConfig, queryToken);
	//
	// 		this.logger.debug('Done. Next up: getRedirect().');
	// 		const oauthResponse: OAuthResponse = this.oauthService.getRedirect(response);
	//
	// 		this.logger.debug('Done. Response should now be returned().');
	// 		oauthResponse.jwt = jwtResponse;
	//
	// 		return oauthResponse;
	// 	} catch (error) {
	// 		this.logger.log(error);
	// 		const system: System = await this.systemRepo.findById(systemId);
	// 		return this.oauthService.getOAuthError(error as string, system.oauthConfig?.provider as string);
	// 	}
	// }
}
