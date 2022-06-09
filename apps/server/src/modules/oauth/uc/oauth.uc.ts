import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { System, User } from '@shared/domain';
import { SymetricKeyEncryptionService } from '@shared/infra/encryption/encryption.service';
import { UserRepo } from '@shared/repo';
import { SystemRepo } from '@shared/repo/system';
import { Logger } from '@src/core/logger';
import { FeathersJwtProvider } from '@src/modules/authorization';
import { AuthorizationParams } from '../controller/dto/authorization.params';
import { OauthTokenResponse } from '../controller/dto/oauth-token.response';
import { OAuthResponse } from '../controller/dto/oauth.response';
import { IJWT } from '../interface/jwt.base.interface';
import { OAuthService } from '../oauth.service';

@Injectable()
export class OauthUc {
	constructor(
		private readonly systemRepo: SystemRepo,
		private readonly userRepo: UserRepo,
		private readonly jwtService: FeathersJwtProvider,
		private httpService: HttpService,
		@Inject('OAuthEncryptionService') private readonly oAuthEncryptionService: SymetricKeyEncryptionService,
		private readonly oauthService: OAuthService,
		private logger: Logger
	) {
		this.logger.setContext(OauthUc.name);
	}

	async startOauth(query: AuthorizationParams, systemId: string): Promise<OAuthResponse> {
		const code: string = this.oauthService.checkAuthorizationCode(query);

		const system: System = await this.systemRepo.findById(systemId);

		const queryToken: OauthTokenResponse = await this.oauthService.requestToken(code, system);

		const decodedToken: IJWT = await this.oauthService.validateToken(queryToken.id_token, system);

		const user: User = await this.oauthService.findUser(decodedToken, systemId);

		// const uuid: string = this.oauthService.extractUUID(decodedToken);

		// const user: User = await this.oauthService.findUserById(uuid, systemId);

		const jwtResponse: string = await this.oauthService.getJWTForUser(user);

		const response: OAuthResponse = new OAuthResponse();
		response.jwt = jwtResponse;
		response.idToken = queryToken.id_token;
		response.logoutEndpoint = system.oauthConfig.logoutEndpoint;
		response.provider = system.oauthConfig.provider;

		return response;
	}
}
