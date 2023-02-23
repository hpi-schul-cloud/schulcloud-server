import { Configuration } from '@hpi-schul-cloud/commons';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { EntityId, ICurrentUser, OauthConfig, User } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { DefaultEncryptionService, IEncryptionService } from '@shared/infra/encryption';
import { Logger } from '@src/core/logger';
import { AuthenticationService } from '@src/modules/authentication/services/authentication.service';
import { UserService } from '@src/modules/user';
import { AxiosResponse } from 'axios';
import jwt, { JwtPayload } from 'jsonwebtoken';
import JwksRsa from 'jwks-rsa';
import QueryString from 'qs';
import { lastValueFrom, Observable } from 'rxjs';
import { OauthTokenResponse, TokenRequestPayload } from '../controller/dto';
import { OAuthSSOError } from '../error/oauth-sso.error';
import { SSOErrorCode } from '../error/sso-error-code.enum';
import { IJwt } from '../interface/jwt.base.interface';
import { TokenRequestMapper } from '../mapper/token-request.mapper';

@Injectable()
export class OAuthService {
	constructor(
		private readonly userService: UserService,
		private readonly authenticationService: AuthenticationService,
		private readonly httpService: HttpService,
		@Inject(DefaultEncryptionService) private readonly oAuthEncryptionService: IEncryptionService,
		private readonly logger: Logger
	) {
		this.logger.setContext(OAuthService.name);
	}

	async requestToken(code: string, oauthConfig: OauthConfig): Promise<OauthTokenResponse> {
		const payload = this.buildTokenRequestPayload(code, oauthConfig);
		const responseTokenObservable = this.sendTokenRequest(payload);
		const responseToken = this.resolveTokenRequest(responseTokenObservable);
		return responseToken;
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
			throw new OAuthSSOError('Failed to validate idToken', SSOErrorCode.SSO_JWT_PROBLEM);
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
			throw new OAuthSSOError(
				`Failed to find user with Id ${externalUserId} ${additionalInfo}`,
				SSOErrorCode.SSO_USER_NOT_FOUND
			);
		}
		return user;
	}

	async getJwtForUser(userId: EntityId): Promise<string> {
		const currentUser: ICurrentUser = await this.userService.getResolvedUser(userId);
		const { accessToken } = await this.authenticationService.generateJwt(currentUser);
		return accessToken;
	}

	getPostLoginRedirectUrl(provider: string, idToken = '', logoutEndpoint = '', postLoginRedirect?: string): string {
		const clientUrl: string = Configuration.get('HOST') as string;
		const dashboardUrl: URL = new URL('/dashboard', clientUrl);

		let redirect: string;
		if (provider === 'iserv') {
			const iservLogoutUrl: URL = new URL(logoutEndpoint);
			iservLogoutUrl.searchParams.append('id_token_hint', idToken);
			iservLogoutUrl.searchParams.append('post_logout_redirect_uri', postLoginRedirect || dashboardUrl.toString());

			redirect = iservLogoutUrl.toString();
		} else if (postLoginRedirect) {
			redirect = postLoginRedirect;
		} else {
			redirect = dashboardUrl.toString();
		}

		return redirect;
	}

	getAuthenticationUrl(
		type: string,
		oauthConfig: OauthConfig,
		state: string,
		migration: boolean,
		alias?: string
	): string {
		const publicBackendUrl: string = Configuration.get('PUBLIC_BACKEND_URL') as string;
		const authenticationUrl: URL = new URL(oauthConfig.authEndpoint);

		authenticationUrl.searchParams.append('client_id', oauthConfig.clientId);
		if (migration) {
			const migrationRedirectUri: URL = new URL(`api/v3/sso/oauth/migration`, publicBackendUrl);
			authenticationUrl.searchParams.append('redirect_uri', migrationRedirectUri.toString());
		} else {
			const redirectUri: URL = new URL(`api/v3/sso/oauth`, publicBackendUrl);
			authenticationUrl.searchParams.append('redirect_uri', redirectUri.toString());
		}
		authenticationUrl.searchParams.append('response_type', oauthConfig.responseType);
		authenticationUrl.searchParams.append('scope', oauthConfig.scope);
		authenticationUrl.searchParams.append('state', state);
		if (alias && type === 'oidc') {
			authenticationUrl.searchParams.append('kc_idp_hint', alias);
		}

		return authenticationUrl.toString();
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
			throw new OAuthSSOError('Requesting token failed.', SSOErrorCode.SSO_AUTH_CODE_STEP);
		}

		return responseToken.data;
	}

	private async getAdditionalErrorInfo(email: string | undefined): Promise<string> {
		if (email) {
			const usersWithEmail: User[] = await this.userService.findByEmail(email);
			const user = usersWithEmail && usersWithEmail.length > 0 ? usersWithEmail[0] : undefined;
			return ` [schoolId: ${user?.school.id ?? ''}, currentLdapId: ${user?.externalId ?? ''}]`;
		}
		return '';
	}
}
