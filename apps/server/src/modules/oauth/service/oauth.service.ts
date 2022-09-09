import jwt from 'jsonwebtoken';
import { HttpService } from '@nestjs/axios';
import JwksRsa from 'jwks-rsa';
import QueryString from 'qs';
import { lastValueFrom } from 'rxjs';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { OauthConfig, System, User } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { DefaultEncryptionService, IEncryptionService } from '@shared/infra/encryption';
import { SystemRepo, UserRepo } from '@shared/repo';
import { Configuration } from '@hpi-schul-cloud/commons';
import { AxiosResponse } from 'axios';
import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';
import { ProvisioningService } from '@src/modules/provisioning/service/provisioning.service';
import { TokenRequestMapper } from '../mapper/token-request.mapper';
import { TokenRequestPayload } from '../controller/dto/token-request.payload';
import { OAuthSSOError } from '../error/oauth-sso.error';
import { OauthTokenResponse } from '../controller/dto/oauth-token.response';
import { FeathersJwtProvider } from '../../authorization';
import { IJwt } from '../interface/jwt.base.interface';
import { OAuthResponse } from './dto/oauth.response';
import { AuthorizationParams } from '../controller/dto/authorization.params';

@Injectable()
export class OAuthService {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly systemRepo: SystemRepo,
		private readonly jwtService: FeathersJwtProvider,
		private readonly httpService: HttpService,
		@Inject(DefaultEncryptionService) private readonly oAuthEncryptionService: IEncryptionService,
		private readonly logger: Logger,
		private readonly provisioningService: ProvisioningService
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
			this.logger.warn(`SSO Oauth authorization code request return with an error: ${query.error}`);
		}
		throw new OAuthSSOError('Authorization Query Object has no authorization code or error', errorCode);
	}

	async requestToken(code: string, oauthConfig: OauthConfig): Promise<OauthTokenResponse> {
		this.logger.debug('requestToken() has started. Next up: decrypt().');
		const decryptedClientSecret: string = this.oAuthEncryptionService.decrypt(oauthConfig.clientSecret);
		this.logger.debug('decrypt() ran succefullly. Next up: post().');
		const tokenRequestPayload: TokenRequestPayload = TokenRequestMapper.createTokenRequestPayload(
			oauthConfig,
			decryptedClientSecret,
			code
		);
		const responseTokenObservable = this.httpService.post<OauthTokenResponse>(
			tokenRequestPayload.tokenEndpoint,
			QueryString.stringify(tokenRequestPayload),
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			}
		);
		this.logger.debug('post() ran succefullly. The tokens should get returned now.');
		let responseToken: AxiosResponse<OauthTokenResponse>;
		try {
			responseToken = await lastValueFrom(responseTokenObservable);
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

	async findUser(accessToken: string, idToken: string, systemId: string): Promise<User> {
		const sub: string | undefined = jwt.decode(idToken, { json: true })?.sub;

		if (!sub) {
			throw new BadRequestException(`Provided idToken: ${idToken} has no sub.`);
		}

		this.logger.debug(`provisioning is running for user with sub: ${sub} and system with id: ${systemId}`);
		const provisioningDto: ProvisioningDto = await this.provisioningService.process(accessToken, idToken, systemId);

		try {
			const user: User = await this.userRepo.findByExternalIdOrFail(provisioningDto.externalUserId, systemId);
			return user;
		} catch (error) {
			throw new OAuthSSOError('Failed to find user with this Id', 'sso_user_notfound');
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

	async processOAuth(query: AuthorizationParams, systemId: string): Promise<OAuthResponse> {
		try {
			this.logger.debug('Oauth process started for systemId {}', systemId);
			const authCode: string = this.checkAuthorizationCode(query);
			const system: System = await this.systemRepo.findById(systemId);
			const { oauthConfig } = system;
			if (oauthConfig == null) {
				this.logger.warn(
					`SSO Oauth process couldn't be started, because of missing oauthConfig of system: ${system.id}`
				);
				throw new OAuthSSOError('Requested system has no oauth configured', 'sso_internal_error');
			}
			const queryToken: OauthTokenResponse = await this.requestToken(authCode, oauthConfig);
			await this.validateToken(queryToken.id_token, oauthConfig);

			const user: User = await this.findUser(queryToken.access_token, queryToken.id_token, system.id);
			const jwtResponse: string = await this.getJwtForUser(user);

			const response: OAuthResponse = this.buildResponse(oauthConfig, queryToken);

			response.redirect = this.getRedirectUrl(response.provider, response.idToken, response.logoutEndpoint);
			response.jwt = jwtResponse;
			return response;
		} catch (error) {
			const oauthResponse: OAuthResponse = await this.systemRepo
				.findById(systemId)
				.then((system: System) => {
					const provider = system.oauthConfig ? system.oauthConfig.provider : 'unknown-provider';
					const oAuthError = this.getOAuthError(error, provider);
					return oAuthError;
				})
				.catch(() => {
					throw new NotFoundException(`No system with id: ${systemId} found`);
				});
			return oauthResponse;
		}
	}

	/**
	 * Builds the URL from the given parameters.
	 *
	 * @param provider
	 * @param idToken
	 * @param logoutEndpoint
	 * @return built redirectUrl
	 */
	getRedirectUrl(provider: string, idToken: string | undefined, logoutEndpoint: string | undefined): string {
		const HOST = Configuration.get('HOST') as string;
		// iserv strategy
		let redirect = '';
		if (!idToken || !logoutEndpoint) {
			this.logger.debug(
				'No redirectUrl could set because of missing idToken or logoutEndpoint of provider: {}',
				provider
			);
			return redirect;
		}
		if (provider === 'iserv') {
			redirect = `${logoutEndpoint}?id_token_hint=${idToken}&post_logout_redirect_uri=${HOST}/dashboard`;
		} else {
			redirect = `${HOST}/dashboard`;
		}
		return redirect;
	}

	getOAuthError(error: unknown, provider: string): OAuthResponse {
		this.logger.warn(error);
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
