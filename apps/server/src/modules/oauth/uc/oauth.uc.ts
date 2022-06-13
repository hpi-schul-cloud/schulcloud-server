import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { AuthorizationParams } from '../controller/dto/authorization.params';
import { OAuthResponse } from '../service/dto/oauth.response';
import { OAuthService } from '../service/oauth.service';

@Injectable()
export class OauthUc {
	constructor(private readonly oauthService: OAuthService, private logger: Logger) {
		this.logger.setContext(OauthUc.name);
	}

	async startOauth(query: AuthorizationParams, systemId: string): Promise<OAuthResponse> {
		let oauthResponse: OAuthResponse;
		try {
			oauthResponse = await this.oauthService.processOauth(query.code as string, query.error as string, systemId);
		} catch (error) {
			oauthResponse = this.oauthService.getOAuthError(error);
		}
		return oauthResponse;
	}
}
