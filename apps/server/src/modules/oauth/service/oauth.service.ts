import jwt, { JwtPayload } from 'jsonwebtoken';
import { HttpService } from '@nestjs/axios';
import JwksRsa from 'jwks-rsa';
import QueryString from 'qs';
import { lastValueFrom, Observable } from 'rxjs';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { OauthConfig } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { DefaultEncryptionService, IEncryptionService } from '@shared/infra/encryption';
import { Configuration } from '@hpi-schul-cloud/commons';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { AxiosResponse } from 'axios';
import { BadRequestException, Inject, UnauthorizedException } from '@nestjs/common';
import { ProvisioningDto, ProvisioningService } from '@src/modules/provisioning';
import { SystemService } from '@src/modules/system/service/system.service';
import { OauthTokenResponse } from '@src/modules/oauth/controller/dto';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { TokenRequestMapper } from '../mapper/token-request.mapper';
import { TokenRequestPayload } from '../controller/dto/token-request.payload';
import { OAuthSSOError } from '../error/oauth-sso.error';
import { IJwt } from '../interface/jwt.base.interface';
import { OAuthResponse } from './dto/oauth.response';
import { AuthorizationParams } from '../controller/dto/authorization.params';

@Injectable()
export class OAuthService {
	constructor(
		private readonly userDORepo: UserDORepo,
		private readonly httpService: HttpService,
		@Inject(DefaultEncryptionService) private readonly oAuthEncryptionService: IEncryptionService,
		private readonly logger: Logger,
		private readonly provisioningService: ProvisioningService,
		private readonly systemService: SystemService
	) {
		this.logger.setContext(OAuthService.name);
	}

	async authenticateUser(authCode: string, systemId: string): Promise<{ user: UserDO; redirect: string }> {
		const system = await this.systemService.findOAuthById(systemId);
		if (!system.id) {
			// unreachable. System loaded from DB always has an ID
			throw new UnauthorizedException(`System with id "${systemId}" does not exist.`);
		}

		const oauthConfig: OauthConfig = this.extractOauthConfigFromSystem(system);

		const queryToken: OauthTokenResponse = await this.requestToken(authCode, oauthConfig);

		await this.validateToken(queryToken.id_token, oauthConfig);

		const user: UserDO = await this.findUser(queryToken.access_token, queryToken.id_token, system.id);
		const redirect = this.getRedirectUrl(oauthConfig.provider, queryToken.id_token, oauthConfig.logoutEndpoint);
		return { user, redirect };
	}

	/**
	 * @deprecated not needed after change of oauth login to authentication module
	 *
	 * @query query input that has either a code or an error
	 * @return authorization code or throws an error
	 */
	checkAuthorizationCode(query: AuthorizationParams): string {
		if (query.code) {
			return query.code;
		}

		throw new OAuthSSOError(
			'Authorization Query Object has no authorization code or error',
			query.error || 'sso_auth_code_step'
		);
	}

	async requestToken(code: string, oauthConfig: OauthConfig): Promise<OauthTokenResponse> {
		const payload = this.buildTokenRequestPayload(code, oauthConfig);
		const responseTokenObservable = this.sendTokenRequest(payload);
		const responseToken = this.resolveTokenRequest(responseTokenObservable);
		return responseToken;
	}

	private extractOauthConfigFromSystem(system: SystemDto): OauthConfig {
		const { oauthConfig } = system;
		if (oauthConfig == null) {
			this.logger.warn(
				`SSO Oauth process couldn't be started, because of missing oauthConfig of system: ${system.id ?? 'undefined'}`
			);
			throw new UnauthorizedException('Requested system has no oauth configured', 'sso_internal_error');
		}
		return oauthConfig;
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
		const verifiedJWT: string | jwt.JwtPayload = jwt.verify(idToken, publicKey, {
			algorithms: ['RS256'],
			issuer: oauthConfig.issuer,
			audience: oauthConfig.clientId,
		});

		if (typeof verifiedJWT === 'string') {
			throw new OAuthSSOError('Failed to validate idToken', 'sso_token_verfication_error');
		}

		return verifiedJWT as IJwt;
	}

	async findUser(accessToken: string, idToken: string, systemId: string): Promise<UserDO> {
		const sub: string | undefined = jwt.decode(idToken, { json: true })?.sub;

		if (!sub) {
			throw new BadRequestException(`Provided idToken: ${idToken} has no sub.`);
		}

		this.logger.debug(`provisioning is running for user with sub: ${sub} and system with id: ${systemId}`);
		const provisioningDto: ProvisioningDto = await this.provisioningService.process(accessToken, idToken, systemId);

		try {
			const user: UserDO = await this.userDORepo.findByExternalIdOrFail(provisioningDto.externalUserId, systemId);

			return user;
		} catch (error) {
			const decodedToken: JwtPayload | null = jwt.decode(idToken, { json: true });
			const email = decodedToken?.email as string | undefined;
			let emailInfo = '';
			if (email) {
				emailInfo = `, email: ${email}`;
			}
			throw new OAuthSSOError(
				`Failed to find user with Id ${provisioningDto.externalUserId}${emailInfo}`,
				'sso_user_notfound'
			);
		}
	}

	buildResponse(oauthConfig: OauthConfig, queryToken: OauthTokenResponse) {
		const response: OAuthResponse = new OAuthResponse();
		response.idToken = queryToken.id_token;
		response.logoutEndpoint = oauthConfig.logoutEndpoint;
		response.provider = oauthConfig.provider;
		return response;
	}

	/**
	 * Builds the URL from the given parameters.
	 *
	 * @param provider
	 * @param idToken
	 * @param logoutEndpoint
	 * @return built redirectUrl
	 */
	getRedirectUrl(provider: string, idToken = '', logoutEndpoint = ''): string {
		const HOST = Configuration.get('HOST') as string;

		// iserv strategy
		// TODO: move to client in https://ticketsystem.dbildungscloud.de/browse/N21-381
		let redirect: string;
		if (provider === 'iserv') {
			redirect = `${logoutEndpoint}?id_token_hint=${idToken}&post_logout_redirect_uri=${HOST}/dashboard`;
		} else {
			redirect = `${HOST}/dashboard`;
		}

		return redirect;
	}

	getOAuthErrorResponse(error: unknown, provider: string): OAuthResponse {
		this.logger.error(error);

		const oauthResponse = new OAuthResponse();

		oauthResponse.provider = provider;

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
