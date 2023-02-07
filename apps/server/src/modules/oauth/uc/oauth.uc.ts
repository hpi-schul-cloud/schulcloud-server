import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { SystemService } from '@src/modules/system';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { AuthorizationParams } from '../controller/dto';
import { OAuthProcessDto } from '../service/dto/oauth-process.dto';
import { OAuthService } from '../service/oauth.service';

/**
 * @deprecated remove after login via oauth moved to authentication module
 */
@Injectable()
export class OauthUc {
	constructor(
		private readonly oauthService: OAuthService,
		private readonly systemService: SystemService,
		private readonly logger: Logger
	) {
		this.logger.setContext(OauthUc.name);
	}

	async processOAuth(query: AuthorizationParams, systemId: string): Promise<OAuthProcessDto> {
		try {
			const oAuthResponsePromise = this.process(query, systemId);
			return await oAuthResponsePromise;
		} catch (error) {
			return await this.getOauthErrorResponse(error, systemId);
		}
	}

	private async process(query: AuthorizationParams, systemId: string): Promise<OAuthProcessDto> {
		this.logger.debug(`Oauth process started for systemId ${systemId}`);

		const authCode: string = this.oauthService.checkAuthorizationCode(query);

		const { user, redirect }: { user?: UserDO; redirect: string } = await this.oauthService.authenticateUser(
			authCode,
			systemId
		);

		let jwtResponse;
		if (user && user.id) {
			jwtResponse = await this.oauthService.getJwtForUser(user.id);
		}

		const response: OAuthProcessDto = new OAuthProcessDto({
			jwt: jwtResponse ?? undefined,
			redirect,
		});

		return response;
	}

	private async getOauthErrorResponse(error, systemId: string): Promise<OAuthProcessDto> {
		const system: SystemDto = await this.systemService.findOAuthById(systemId);
		const provider: string = system.oauthConfig ? system.oauthConfig.provider : 'unknown-provider';
		const oAuthError: OAuthProcessDto = this.oauthService.getOAuthErrorResponse(error, provider);
		return oAuthError;
	}
}
