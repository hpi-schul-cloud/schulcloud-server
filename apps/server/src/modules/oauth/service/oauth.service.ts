import jwt from 'jsonwebtoken';
import { HttpService } from '@nestjs/axios';
import JwksRsa from 'jwks-rsa';
import QueryString from 'qs';
import { lastValueFrom, Observable } from 'rxjs';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { OauthConfig, User } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { DefaultEncryptionService, IEncryptionService } from '@shared/infra/encryption';
import { UserRepo } from '@shared/repo';
import { Configuration } from '@hpi-schul-cloud/commons';
import { AxiosResponse } from 'axios';
import { Inject, NotFoundException } from '@nestjs/common';

import { SystemService } from '@src/modules/system/service/system.service';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { TokenRequestMapper } from '../mapper/token-request.mapper';
import { TokenRequestPayload } from '../controller/dto/token-request.payload';
import { OAuthSSOError } from '../error/oauth-sso.error';
import { OauthTokenResponse } from '../controller/dto/oauth-token.response';
import { FeathersJwtProvider } from '../../authorization';
import { IservOAuthService } from './iserv-oauth.service';
import { IJwt } from '../interface/jwt.base.interface';
import { OAuthResponse } from './dto/oauth.response';
import { AuthorizationParams } from '../controller/dto/authorization.params';

@Injectable()
export class OAuthService {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly systemService: SystemService,
		private readonly jwtService: FeathersJwtProvider,
		private readonly httpService: HttpService,
		@Inject(DefaultEncryptionService) private readonly oAuthEncryptionService: IEncryptionService,
		private readonly iservOauthService: IservOAuthService,
		private readonly logger: Logger
	) {
		this.logger.setContext(OAuthService.name);
	}

	/**
	 * @query query input that has either a code or an error
	 * @return authorization code or throws an error
	 */
	checkAuthorizationCode(query: AuthorizationParams): string {
		if (query.code) {
			return query.code;
		}

		let errorCode = 'sso_auth_code_step';

		if (query.error) {
			errorCode = `sso_oauth_${query.error}`;
			this.logger.error(`SSO Oauth authorization code request return with an error: ${query.code as string}`);
		}
		throw new OAuthSSOError('Authorization Query Object has no authorization code or error', errorCode);
	}

	async requestToken(code: string, oauthConfig: OauthConfig): Promise<OauthTokenResponse> {
		const payload = this.buildTokenRequestPayload(code, oauthConfig);
		const responseTokenObservable = this.sendTokenRequest(payload);
		const responseToken = this.resolveTokenRequest(responseTokenObservable);
		return responseToken;
	}

	private buildTokenRequestPayload(code: string, oauthConfig: OauthConfig): TokenRequestPayload {
		const decryptedClientSecret: string = this.oAuthEncryptionService.decrypt(oauthConfig.clientSecret);
		const tokenRequestPayload: TokenRequestPayload = TokenRequestMapper.createTokenRequestPayload(
			oauthConfig,
			decryptedClientSecret,
			code
		);
		return tokenRequestPayload;
	}

	private sendTokenRequest(payload: TokenRequestPayload): Observable<AxiosResponse<OauthTokenResponse, unknown>> {
		const query = QueryString.stringify(payload);
		const responseTokenObservable = this.httpService.post<OauthTokenResponse>(`${payload.tokenEndpoint}`, query, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		});
		return responseTokenObservable;
	}

	private async resolveTokenRequest(
		observable: Observable<AxiosResponse<OauthTokenResponse, unknown>>
	): Promise<OauthTokenResponse> {
		let responseToken: AxiosResponse<OauthTokenResponse>;
		try {
			responseToken = await lastValueFrom(observable);
		} catch (error) {
			throw new OAuthSSOError('Requesting token failed.', 'sso_auth_code_step');
		}
		return responseToken.data;
	}

	async _getPublicKey(oauthConfig: OauthConfig): Promise<string> {
		const client: JwksRsa.JwksClient = JwksRsa({
			cache: true,
			jwksUri: oauthConfig.jwksEndpoint,
		});
		const key: JwksRsa.SigningKey = await client.getSigningKey();
		return key.getPublicKey();
	}

	async validateToken(idToken: string, oauthConfig: OauthConfig): Promise<IJwt> {
		const publicKey = await this._getPublicKey(oauthConfig);
		const verifiedJWT = jwt.verify(idToken, publicKey, {
			algorithms: ['RS256'],
			issuer: oauthConfig.issuer,
			audience: oauthConfig.clientId,
		});
		if (typeof verifiedJWT === 'string' || verifiedJWT instanceof String)
			throw new OAuthSSOError('Failed to validate idToken', 'sso_token_verfication_error');
		return verifiedJWT as IJwt;
	}

	async findUser(decodedJwt: IJwt, oauthConfig: OauthConfig, systemId: string): Promise<User> {
		// iserv strategy
		if (oauthConfig && oauthConfig.provider === 'iserv') {
			return this.iservOauthService.findUserById(systemId, decodedJwt);
		}
		// TODO Temporary change - wait for N21-138 merge
		// This user id resolution is trial and error at the moment. It is ought to be replaced by a proper strategy pattern (N21-138)
		// See scope of EW-325
		try {
			return await this.userRepo.findById(decodedJwt.sub);
		} catch (error) {
			try {
				return await this.userRepo.findByLdapIdOrFail(decodedJwt.preferred_username ?? '', systemId);
			} catch {
				throw new OAuthSSOError('Failed to find user with this Id', 'sso_user_notfound');
			}
		}
	}

	async getJwtForUser(user: User): Promise<string> {
		const stringPromise = this.jwtService.generateJwt(user.id);
		return stringPromise;
	}

	buildResponse(oauthConfig: OauthConfig, queryToken: OauthTokenResponse) {
		const response: OAuthResponse = new OAuthResponse();
		response.idToken = queryToken.id_token;
		response.logoutEndpoint = oauthConfig.logoutEndpoint;
		response.provider = oauthConfig.provider;
		return response;
	}

	getRedirect(response: OAuthResponse): OAuthResponse {
		const HOST = Configuration.get('HOST') as string;
		let redirect: string;
		const oauthResponse: OAuthResponse = new OAuthResponse();
		// iserv strategy
		if (response.provider === 'iserv') {
			const idToken = response.idToken as string;
			const logoutEndpoint = response.logoutEndpoint as string;
			redirect = `${logoutEndpoint}?id_token_hint=${idToken}&post_logout_redirect_uri=${HOST}/dashboard`;
		} else {
			redirect = `${HOST}/dashboard`;
		}
		oauthResponse.redirect = redirect;
		return oauthResponse;
	}

	async getOauthConfig(systemId: string): Promise<OauthConfig> {
		const system: SystemDto = await this.systemService.findById(systemId);
		if (system.oauthConfig) {
			return system.oauthConfig;
		}
		throw new NotFoundException(`No OAuthConfig Available in the given System ${system.id ?? ''}!`);
	}

	getOAuthError(error: unknown, provider: string): OAuthResponse {
		this.logger.error(error);
		const oauthResponse = new OAuthResponse();
		if (error instanceof OAuthSSOError) {
			oauthResponse.errorcode = error.errorcode;
		} else {
			oauthResponse.errorcode = 'oauth_login_failed';
		}
		oauthResponse.redirect = `${Configuration.get('HOST') as string}/login?error=${
			oauthResponse.errorcode
		}&provider=${provider}`;
		return oauthResponse;
	}
}
