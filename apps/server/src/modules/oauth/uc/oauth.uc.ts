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
		this.logger.debug('starting oauth process...');
		const promise: Promise<OAuthResponse> = this.oauthService.processOAuth(query, systemId);
		const oAuthResponse: OAuthResponse = await promise;

		return promise;
	}
}
