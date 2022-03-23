import { Inject, Injectable } from '@nestjs/common';
import { ILogger, Logger } from '@src/core/logger';
import { HttpService } from '@nestjs/axios';
import jwtDecode from 'jwt-decode';
import { SystemRepo } from '@shared/repo/system';
import { UserRepo } from '@shared/repo';
import { System, User } from '@shared/domain';
import { FeathersJwtProvider } from '@src/modules/authorization/feathers-jwt.provider';
import { SymetricKeyEncryptionService } from '@shared/infra/encryption/encryption.service';
import { lastValueFrom } from 'rxjs';
import QueryString from 'qs';
import { TokenRequestResponse } from '../controller/dto/token-request-response';
import { OauthTokenResponse } from '../controller/dto/oauth-token-response';
import { AuthorizationParams } from '../controller/dto/authorization-params';
import { OAuthResponse } from '../controller/dto/oauth-response';
import { TokenRequestResponseMapper } from '../mapper/token-request-response.mapper';
import { OAuthSSOError } from '../error/oauth-sso.error';

@Injectable()
export class OauthUc {
	private logger: ILogger;

	constructor(
		private readonly systemRepo: SystemRepo,
		private readonly userRepo: UserRepo,
		private readonly jwtService: FeathersJwtProvider,
		private httpService: HttpService,
		@Inject('OAuthEncryptionService') private readonly oAuthEncryptionService: SymetricKeyEncryptionService
	) {
		this.logger = new Logger(OauthUc.name);
	}

	// 0- start Oauth Process
	async startOauth(query: AuthorizationParams, systemId: string): Promise<OAuthResponse> {
		// get the authorization code
		const code: string = this.checkAuthorizationCode(query);
		// get the Tokens using the authorization code
		const queryToken: OauthTokenResponse = await this.requestToken(code, systemId);
		// extract the uuid from the token
		const uuid = this.decodeToken(queryToken.id_token);
		// get the user using the uuid
		const user: User = await this.findUserById(uuid, systemId);
		// create JWT for the user
		const jwt: string = await this.getJWTForUser(user);
		// send response back
		const response: OAuthResponse = new OAuthResponse();
		response.jwt = jwt;
		response.idToken = queryToken.id_token;
		response.logoutEndpoint = (await this.systemRepo.findById(systemId)).oauthConfig.logoutEndpoint;
		return response;
	}

	/**
	 * @query query input that has either a code or an error
	 * @return authorization code or throws an error
	 */
	checkAuthorizationCode(query: AuthorizationParams): string {
		if (query.code) return query.code;
		let errorCode = 'sso_auth_code_step';
		if (query.error) {
			errorCode = `sso_oauth_${query.error}`;
			this.logger.error(`SSO Oauth authorization code request return with an error: ${query.code as string}`);
		}
		throw new OAuthSSOError('Authorization Query Object has no authorization code or error', errorCode);
	}

	// 1- use Authorization Code to get a valid Token
	async requestToken(code: string, systemId: string): Promise<OauthTokenResponse> {
		const system: System = await this.systemRepo.findById(systemId);
		const decryptedClientSecret: string = this.oAuthEncryptionService.decrypt(system.oauthConfig.clientSecret);
		const tokenRequestResponse: TokenRequestResponse = TokenRequestResponseMapper.mapToResponse(
			system,
			decryptedClientSecret,
			code
		);

		const responseTokenObservable = this.httpService.post<OauthTokenResponse>(
			tokenRequestResponse.tokenEndpoint,
			QueryString.stringify(tokenRequestResponse.tokenRequestParams),
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			}
		);

		const responseToken = await lastValueFrom(responseTokenObservable);
		return responseToken.data;
	}

	// 2- decode the Token to extract the UUID
	decodeToken(token: string): string {
		const decodedJwt: IJWT = jwtDecode(token);
		if (!decodedJwt || !decodedJwt.uuid) throw new OAuthSSOError('Failed to extract uuid', 'sso_jwt_problem');
		const { uuid } = decodedJwt;
		return uuid;
	}

	// 1.1- Token Validation? (later)

	// 3- get user using the UUID (userHelpers.js?)
	async findUserById(uuid: string, systemId: string): Promise<User> {
		let user: User;
		try {
			user = await this.userRepo.findByLdapId(uuid, systemId);
		} catch (error) {
			throw new OAuthSSOError('Failed to find user with this ldapId', 'sso_user_notfound');
		}
		return user;
	}

	// 3.1- User bestätigen?

	// 4- JWT erzeugen (oder finden)
	async getJWTForUser(user: User): Promise<string> {
		const jwt: string = await this.jwtService.generateJwt(user.id);
		return jwt;
	}
}

export interface IJWT {
	uuid: string;
}
