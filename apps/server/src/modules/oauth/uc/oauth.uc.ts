import { Injectable, NotFoundException } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { AuthorizationParams } from '../controller/dto/authorization.params';
import { OAuthResponse } from '../service/dto/oauth.response';
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

	async startOauth(query: AuthorizationParams, systemId: string): Promise<OAuthResponse> {
		const promise: Promise<OAuthResponse> = this.oauthService.processOAuth(query, systemId);
		return promise;
	}
}
