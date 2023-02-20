import { Configuration } from '@hpi-schul-cloud/commons';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { EntityId, OauthConfig, User } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { DefaultEncryptionService, IEncryptionService } from '@shared/infra/encryption';
import { Logger } from '@src/core/logger';
import { FeathersJwtProvider } from '@src/modules/authorization';
import { UserService } from '@src/modules/user';
import { AxiosResponse } from 'axios';
import jwt, { JwtPayload } from 'jsonwebtoken';
import JwksRsa from 'jwks-rsa';
import QueryString from 'qs';
import { lastValueFrom, Observable } from 'rxjs';
import { AuthorizationParams, OauthTokenResponse, TokenRequestPayload } from '../controller/dto';
import { OAuthSSOError } from '../error/oauth-sso.error';
import { IJwt } from '../interface/jwt.base.interface';
import { TokenRequestMapper } from '../mapper/token-request.mapper';
import { OAuthProcessDto } from './dto/oauth-process.dto';

@Injectable()
export class OAuthService {
	constructor(
		private readonly userService: UserService,
		private readonly jwtService: FeathersJwtProvider,
		private readonly httpService: HttpService,
		@Inject(DefaultEncryptionService) private readonly oAuthEncryptionService: IEncryptionService,
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

		throw new OAuthSSOError(
			'Authorization Query Object has no authorization code or error',
			query.error || 'sso_auth_code_step'
		);
	}

	async requestToken(code: string, oauthConfig: OauthConfig, migrationRedirect?: string): Promise<OauthTokenResponse> {
		const payload: TokenRequestPayload = this.buildTokenRequestPayload(code, oauthConfig, migrationRedirect);
		const responseTokenObservable = this.sendTokenRequest(payload);
		const responseToken = this.resolveTokenRequest(responseTokenObservable);

		return responseToken;
	}

	private buildTokenRequestPayload(
		code: string,
		oauthConfig: OauthConfig,
		migrationRedirect?: string
	): TokenRequestPayload {
		const decryptedClientSecret: string = this.oAuthEncryptionService.decrypt(oauthConfig.clientSecret);

		const tokenRequestPayload: TokenRequestPayload = TokenRequestMapper.createTokenRequestPayload(
			oauthConfig,
			decryptedClientSecret,
			code,
			migrationRedirect
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

	async findUser(idToken: string, externalUserId: EntityId, systemId: EntityId): Promise<UserDO> {
		const decodedToken: JwtPayload | null = jwt.decode(idToken, { json: true });

		if (!decodedToken?.sub) {
			throw new BadRequestException(`Provided idToken: ${idToken} has no sub.`);
		}

		this.logger.debug(`provisioning is running for user with sub: ${decodedToken.sub} and system with id: ${systemId}`);
		const user: UserDO | null = await this.userService.findByExternalId(externalUserId, systemId);
		if (!user) {
			const additionalInfo: string = await this.getAdditionalErrorInfo(decodedToken?.email as string | undefined);
			throw new OAuthSSOError(`Failed to find user with Id ${externalUserId} ${additionalInfo}`, 'sso_user_notfound');
		}
		return user;
	}

	private async getAdditionalErrorInfo(email: string | undefined): Promise<string> {
		if (email) {
			const usersWithEmail: User[] = await this.userService.findByEmail(email);
			const user = usersWithEmail && usersWithEmail.length > 0 ? usersWithEmail[0] : undefined;
			return ` [schoolId: ${user?.school.id ?? ''}, currentLdapId: ${user?.externalId ?? ''}]`;
		}
		return '';
	}

	async getJwtForUser(userId: EntityId): Promise<string> {
		const stringPromise: Promise<string> = this.jwtService.generateJwt(userId);
		return stringPromise;
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

	getOAuthErrorResponse(error: unknown, provider: string): OAuthProcessDto {
		this.logger.error(error);

		let errorCode: string;
		if (error instanceof OAuthSSOError) {
			errorCode = error.errorcode;
		} else {
			errorCode = 'oauth_login_failed';
		}

		const redirect = new URL('/login', Configuration.get('HOST') as string);
		redirect.searchParams.append('error', errorCode);
		redirect.searchParams.append('provider', provider);

		const oauthResponse = new OAuthProcessDto({
			provider,
			errorCode,
			redirect: redirect.toString(),
		});
		return oauthResponse;
	}
}
