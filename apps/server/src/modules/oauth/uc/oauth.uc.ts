import { Inject, Injectable } from '@nestjs/common';
import { ILogger, Logger } from '@src/core/logger';
import { HttpService } from '@nestjs/axios';
import { SystemRepo } from '@shared/repo/system';
import { UserRepo } from '@shared/repo';
import { System, User } from '@shared/domain';
import { FeathersJwtProvider } from '@src/modules/authorization/feathers-jwt.provider';
import { SymetricKeyEncryptionService } from '@shared/infra/encryption/encryption.service';
import { lastValueFrom } from 'rxjs';
import QueryString from 'qs';
import jwt from 'jsonwebtoken';
import JwksRsa from 'jwks-rsa';
import { TokenRequestPayload } from '../controller/dto/token-request.payload';
import { OauthTokenResponse } from '../controller/dto/oauth-token.response';
import { AuthorizationParams } from '../controller/dto/authorization.params';
import { OAuthResponse } from '../controller/dto/oauth.response';
import { TokenRequestPayloadMapper } from '../mapper/token-request-payload.mapper';
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

	async startOauth(query: AuthorizationParams, systemId: string): Promise<OAuthResponse> {
		const code: string = this.checkAuthorizationCode(query);

		const system: System = await this.systemRepo.findById(systemId);

		const queryToken: OauthTokenResponse = await this.requestToken(code, system);

		const decodedToken: IJWT = await this.validateToken(queryToken.id_token, system);

		const uuid: string = this.extractUUID(decodedToken);

		const user: User = await this.findUserById(uuid, systemId);

		const jwtResponse: string = await this.getJWTForUser(user);

		const response: OAuthResponse = new OAuthResponse();
		response.jwt = jwtResponse;
		response.idToken = queryToken.id_token;
		response.logoutEndpoint = system.oauthConfig.logoutEndpoint;

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

	async requestToken(code: string, system: System): Promise<OauthTokenResponse> {
		const decryptedClientSecret: string = this.oAuthEncryptionService.decrypt(system.oauthConfig.clientSecret);
		const tokenRequestPayload: TokenRequestPayload = TokenRequestPayloadMapper.mapToResponse(
			system,
			decryptedClientSecret,
			code
		);
		const responseTokenObservable = this.httpService.post<OauthTokenResponse>(
			tokenRequestPayload.tokenEndpoint,
			QueryString.stringify(tokenRequestPayload.tokenRequestParams),
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

	async _getPublicKey(system: System): Promise<string> {
		const client: JwksRsa.JwksClient = JwksRsa({
			cache: true,
			jwksUri: system.oauthConfig.jwksEndpoint,
		});
		const key: JwksRsa.SigningKey = await client.getSigningKey();
		return key.getPublicKey();
	}

	async validateToken(idToken: string, system: System): Promise<IJWT> {
		const publicKey = await this._getPublicKey(system);
		const verifiedJWT = jwt.verify(idToken, publicKey, {
			algorithms: ['RS256'],
			issuer: system.oauthConfig.issuer,
			audience: system.oauthConfig.clientId,
		});
		if (typeof verifiedJWT === 'string' || verifiedJWT instanceof String)
			throw new OAuthSSOError('Failed to validate idToken', 'sso_token_verfication_error');
		return verifiedJWT as IJWT;
	}

	extractUUID(decodedJwt: IJWT): string {
		if (!decodedJwt || !decodedJwt.uuid) throw new OAuthSSOError('Failed to extract uuid', 'sso_jwt_problem');
		const { uuid } = decodedJwt;
		return uuid;
	}

	async findUserById(uuid: string, systemId: string): Promise<User> {
		let user: User;
		try {
			user = await this.userRepo.findByLdapId(uuid, systemId);
		} catch (error) {
			throw new OAuthSSOError('Failed to find user with this ldapId', 'sso_user_notfound');
		}
		return user;
	}

	async getJWTForUser(user: User): Promise<string> {
		const jwtResponse: string = await this.jwtService.generateJwt(user.id);
		return jwtResponse;
	}
}

export interface IJWT {
	uuid: string;
}
