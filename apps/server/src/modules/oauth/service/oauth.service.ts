import { Configuration } from '@hpi-schul-cloud/commons';
import { Inject, UnauthorizedException } from '@nestjs/common';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { OauthConfig } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { DefaultEncryptionService, IEncryptionService } from '@shared/infra/encryption';
import { Logger } from '@src/core/logger';
import { AuthenticationCodeGrantTokenRequest, OauthTokenResponse } from '@src/modules/oauth/controller/dto';
import { ProvisioningDto, ProvisioningService } from '@src/modules/provisioning';
import { OauthDataDto } from '@src/modules/provisioning/dto';
import { SystemService } from '@src/modules/system';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { UserService } from '@src/modules/user';
import { MigrationCheckService, UserMigrationService } from '@src/modules/user-login-migration';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { OAuthSSOError } from '../error/oauth-sso.error';
import { OAuthTokenDto } from '../interface';
import { TokenRequestMapper } from '../mapper/token-request.mapper';
import { OAuthProcessDto } from './dto/oauth-process.dto';
import { OauthAdapterService } from './oauth-adapter.service';

@Injectable()
export class OAuthService {
	constructor(
		private readonly userService: UserService,
		private readonly oauthAdapterService: OauthAdapterService,
		@Inject(DefaultEncryptionService) private readonly oAuthEncryptionService: IEncryptionService,
		private readonly logger: Logger,
		private readonly provisioningService: ProvisioningService,
		private readonly systemService: SystemService,
		private readonly userMigrationService: UserMigrationService,
		private readonly migrationCheckService: MigrationCheckService
	) {
		this.logger.setContext(OAuthService.name);
	}

	async authenticateUser(systemId: string, authCode?: string, errorCode?: string): Promise<OAuthTokenDto> {
		if (errorCode || !authCode) {
			throw new UnauthorizedException(
				'Authorization Query Object has no authorization code or error',
				errorCode || 'sso_auth_code_step'
			);
		}

		const system: SystemDto = await this.systemService.findOAuthById(systemId);
		if (!system.oauthConfig) {
			throw new UnauthorizedException(`Requested system ${systemId} has no oauth configured`, 'sso_internal_error');
		}
		const { oauthConfig } = system;

		const oauthTokens: OAuthTokenDto = await this.requestToken(authCode, oauthConfig, oauthConfig.redirectUri);

		await this.validateToken(oauthTokens.idToken, oauthConfig);

		return oauthTokens;
	}

	async provisionUser(
		systemId: string,
		idToken: string,
		accessToken: string
	): Promise<{ user?: UserDO; redirect: string }> {
		const data: OauthDataDto = await this.provisioningService.getData(systemId, idToken, accessToken);

		let migrationConsentRedirect: string | undefined;
		if (data.externalSchool?.officialSchoolNumber) {
			const shouldUserMigrate: boolean = await this.migrationCheckService.shouldUserMigrate(
				data.externalUser.externalId,
				systemId,
				data.externalSchool.officialSchoolNumber
			);

			if (shouldUserMigrate) {
				migrationConsentRedirect = await this.userMigrationService.getMigrationConsentPageRedirect(
					data.externalSchool.officialSchoolNumber,
					systemId
				);

				const existingUser: UserDO | null = await this.userService.findByExternalId(
					data.externalUser.externalId,
					systemId
				);
				if (!existingUser) {
					return { user: undefined, redirect: migrationConsentRedirect };
				}
			}
		}

		const provisioningDto: ProvisioningDto = await this.provisioningService.provisionData(data);

		const user: UserDO | null = await this.userService.findByExternalId(provisioningDto.externalUserId, systemId);
		if (!user) {
			throw new OAuthSSOError(
				`Provisioning of user with externalId: ${provisioningDto.externalUserId} failed`,
				'sso_user_notfound'
			);
		}

		const postLoginRedirect: string = await this.getPostLoginRedirectUrl(idToken, systemId, migrationConsentRedirect);

		return { user, redirect: postLoginRedirect };
	}

	async requestToken(code: string, oauthConfig: OauthConfig, redirectUri: string): Promise<OAuthTokenDto> {
		const payload: AuthenticationCodeGrantTokenRequest = this.buildTokenRequestPayload(code, oauthConfig, redirectUri);

		const responseToken: OauthTokenResponse = await this.oauthAdapterService.sendAuthenticationCodeTokenRequest(
			oauthConfig.tokenEndpoint,
			payload
		);

		const tokenDto: OAuthTokenDto = TokenRequestMapper.mapTokenResponseToDto(responseToken);
		return tokenDto;
	}

	async validateToken(idToken: string, oauthConfig: OauthConfig): Promise<JwtPayload> {
		const publicKey: string = await this.oauthAdapterService.getPublicKey(oauthConfig.jwksEndpoint);
		const decodedJWT: string | JwtPayload = jwt.verify(idToken, publicKey, {
			algorithms: ['RS256'],
			issuer: oauthConfig.issuer,
			audience: oauthConfig.clientId,
		});

		if (typeof decodedJWT === 'string') {
			throw new OAuthSSOError('Failed to validate idToken', 'sso_token_verfication_error');
		}

		return decodedJWT;
	}

	async getPostLoginRedirectUrl(idToken: string, systemId: string, postLoginRedirect?: string): Promise<string> {
		const clientUrl: string = Configuration.get('HOST') as string;
		const dashboardUrl: URL = new URL('/dashboard', clientUrl);
		const system: SystemDto = await this.systemService.findOAuthById(systemId);

		let redirect: string;
		if (system.oauthConfig?.provider === 'iserv') {
			const iservLogoutUrl: URL = new URL(system.oauthConfig.logoutEndpoint);
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

	getOAuthErrorResponse(error: unknown, provider?: string): OAuthProcessDto {
		this.logger.error(error);

		let errorCode: string;
		if (error instanceof OAuthSSOError) {
			errorCode = error.errorcode;
		} else {
			errorCode = 'oauth_login_failed';
		}

		const redirect = this.createErrorRedirect(errorCode, provider);

		const oauthResponse = new OAuthProcessDto({
			provider,
			errorCode,
			redirect,
		});
		return oauthResponse;
	}

	private buildTokenRequestPayload(
		code: string,
		oauthConfig: OauthConfig,
		redirectUri: string
	): AuthenticationCodeGrantTokenRequest {
		const decryptedClientSecret: string = this.oAuthEncryptionService.decrypt(oauthConfig.clientSecret);

		const tokenRequestPayload: AuthenticationCodeGrantTokenRequest =
			TokenRequestMapper.createAuthenticationCodeGrantTokenRequestPayload(
				oauthConfig.clientId,
				decryptedClientSecret,
				code,
				redirectUri
			);

		return tokenRequestPayload;
	}

	private createErrorRedirect(errorCode: string, provider?: string): string {
		const redirect = new URL('/login', Configuration.get('HOST') as string);
		redirect.searchParams.append('error', errorCode);
		if (provider) {
			redirect.searchParams.append('provider', provider);
		}
		return redirect.toString();
	}
}
