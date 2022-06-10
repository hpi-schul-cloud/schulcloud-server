import jwt from 'jsonwebtoken';
import { HttpService } from '@nestjs/axios';
import JwksRsa from 'jwks-rsa';
import QueryString from 'qs';
import { lastValueFrom } from 'rxjs';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { System, User } from '@shared/domain';
import { Inject } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { SymetricKeyEncryptionService } from '@shared/infra/encryption';
import { SystemRepo, UserRepo } from '@shared/repo';
import { Configuration } from '@hpi-schul-cloud/commons';
import { TokenRequestPayloadMapper } from './mapper/token-request-payload.mapper';
import { TokenRequestPayload } from './controller/dto/token-request.payload';
import { OAuthSSOError } from './error/oauth-sso.error';
import { AuthorizationParams } from './controller/dto/authorization.params';
import { OauthTokenResponse } from './controller/dto/oauth-token.response';
import { FeathersJwtProvider } from '../authorization';
import { IservOAuthService } from './iserv-oauth.service';
import { IJWT } from './interface/jwt.base.interface';
import { OAuthResponse } from './controller/dto/oauth.response';

@Injectable()
export class OAuthService {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly systemRepo: SystemRepo,
		private readonly jwtService: FeathersJwtProvider,
		private httpService: HttpService,
		@Inject('OAuthEncryptionService') private readonly oAuthEncryptionService: SymetricKeyEncryptionService,
		private iservOauthService: IservOAuthService,
		private logger: Logger
	) {
		this.logger.setContext(OAuthService.name);
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
		// if validation by cert, then publicKey = cert
		const verifiedJWT = jwt.verify(idToken, publicKey, {
			algorithms: ['RS256'],
			issuer: system.oauthConfig.issuer,
			audience: system.oauthConfig.clientId,
		});
		if (typeof verifiedJWT === 'string' || verifiedJWT instanceof String)
			throw new OAuthSSOError('Failed to validate idToken', 'sso_token_verfication_error');
		return verifiedJWT as IJWT;
	}

	async findUser(decodedJwt: IJWT, systemId: string): Promise<User> {
		let user: User;
		// if iserv strategy:
		const system: System = await this.systemRepo.findById(systemId);
		if (system.oauthConfig.provider === 'iserv') {
			const uuid = this.iservOauthService.extractUUID(decodedJwt);
			user = await this.iservOauthService.findUserById(uuid, systemId);
			return user;
		}
		// TODO in general
		user = await this.userRepo.findById(decodedJwt.uuid);
		return user;
	}

	async getJWTForUser(user: User): Promise<string> {
		const jwtResponse: string = await this.jwtService.generateJwt(user.id);
		return jwtResponse;
	}

	// buildRedirect(response: OAuthResponse): string {
	// 	const HOST = Configuration.get('HOST') as string;
	// 	let redirect: string;
	// 	let oauthResponse: OAuthResponse;
	// 	try {
	// 		if (response.provider === 'iserv') {
	// 			const idToken = response.idToken as string;
	// 			const logoutEndpoint = response.logoutEndpoint as string;
	// 			redirect = `${logoutEndpoint}?id_token_hint=${idToken}&post_logout_redirect_uri=${HOST}/dashboard`;
	// 		} else {
	// 			redirect = `${HOST}/dashboard`;
	// 		}
	// 		return redirect;
	// 	} catch (error) {
	// 		this.logger.error(error);
	// 		oauthResponse = new OAuthResponse();
	// 		if (error instanceof OAuthSSOError) oauthResponse.errorcode = error.errorcode;
	// 		else oauthResponse.errorcode = 'oauth_login_failed';
	// 	}
	// 	return `${HOST}/login?error=${oauthResponse.errorcode}`;
	// }
}
