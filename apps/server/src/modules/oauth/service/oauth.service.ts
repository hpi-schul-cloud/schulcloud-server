import { Configuration } from '@hpi-schul-cloud/commons';
import { Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { OauthConfig, SchoolFeatures } from '@shared/domain';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { DefaultEncryptionService, IEncryptionService } from '@shared/infra/encryption';
import { Logger } from '@src/core/logger';
import { ProvisioningService } from '@src/modules/provisioning';
import { OauthDataDto } from '@src/modules/provisioning/dto';
import { SchoolService } from '@src/modules/school';
import { SystemService } from '@src/modules/system';
import { SystemDto } from '@src/modules/system/service';
import { UserService } from '@src/modules/user';
import { MigrationCheckService, UserMigrationService } from '@src/modules/user-login-migration';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { OAuthSSOError } from '../error/oauth-sso.error';
import { SSOErrorCode } from '../error/sso-error-code.enum';
import { OAuthTokenDto } from '../interface';
import { TokenRequestMapper } from '../mapper/token-request.mapper';
import { AuthenticationCodeGrantTokenRequest, OauthTokenResponse } from './dto';
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
		private readonly migrationCheckService: MigrationCheckService,
		private readonly schoolService: SchoolService
	) {
		this.logger.setContext(OAuthService.name);
	}

	async authenticateUser(
		systemId: string,
		redirectUri: string,
		authCode?: string,
		errorCode?: string
	): Promise<OAuthTokenDto> {
		if (errorCode || !authCode) {
			throw new OAuthSSOError(
				'Authorization Query Object has no authorization code or error',
				errorCode || 'sso_auth_code_step'
			);
		}

		const system: SystemDto = await this.systemService.findById(systemId);
		if (!system.oauthConfig) {
			throw new OAuthSSOError(`Requested system ${systemId} has no oauth configured`, 'sso_internal_error');
		}
		const { oauthConfig } = system;

		const oauthTokens: OAuthTokenDto = await this.requestToken(authCode, oauthConfig, redirectUri);

		await this.validateToken(oauthTokens.idToken, oauthConfig);

		return oauthTokens;
	}

	async provisionUser(
		systemId: string,
		idToken: string,
		accessToken: string,
		postLoginRedirect?: string
	): Promise<{ user?: UserDO; redirect: string }> {
		const data: OauthDataDto = await this.provisioningService.getData(systemId, idToken, accessToken);

		const externalUserId: string = data.externalUser.externalId;
		const officialSchoolNumber: string | undefined = data.externalSchool?.officialSchoolNumber;

		let provisioning = true;
		let migrationConsentRedirect: string | undefined;

		if (officialSchoolNumber) {
			provisioning = await this.isOauthProvisioningEnabledForSchool(officialSchoolNumber);

			const shouldUserMigrate: boolean = await this.migrationCheckService.shouldUserMigrate(
				externalUserId,
				systemId,
				officialSchoolNumber
			);

			if (shouldUserMigrate) {
				// TODO: https://ticketsystem.dbildungscloud.de/browse/N21-632 Move Redirect Logic URLs to Client
				migrationConsentRedirect = await this.userMigrationService.getMigrationConsentPageRedirect(
					officialSchoolNumber,
					systemId
				);

				const existingUser: UserDO | null = await this.userService.findByExternalId(externalUserId, systemId);
				if (!existingUser) {
					return { user: undefined, redirect: migrationConsentRedirect };
				}
			}
		}

		if (provisioning) {
			await this.provisioningService.provisionData(data);
		}

		const user: UserDO | null = await this.userService.findByExternalId(externalUserId, systemId);
		if (!user) {
			throw new OAuthSSOError(`Provisioning of user with externalId: ${externalUserId} failed`, 'sso_user_notfound');
		}

		// TODO: https://ticketsystem.dbildungscloud.de/browse/N21-632 Move Redirect Logic URLs to Client
		const redirect: string = await this.getPostLoginRedirectUrl(
			idToken,
			systemId,
			postLoginRedirect || migrationConsentRedirect
		);

		return { user, redirect };
	}

	async isOauthProvisioningEnabledForSchool(officialSchoolNumber: string): Promise<boolean> {
		const school: SchoolDO | null = await this.schoolService.getSchoolBySchoolNumber(officialSchoolNumber);

		if (!school) {
			return true;
		}

		return !!school.features?.includes(SchoolFeatures.OAUTH_PROVISIONING_ENABLED);
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
			throw new OAuthSSOError('Failed to validate idToken', SSOErrorCode.SSO_JWT_PROBLEM);
		}

		return decodedJWT;
	}

	async getPostLoginRedirectUrl(idToken: string, systemId: string, postLoginRedirect?: string): Promise<string> {
		const clientUrl: string = Configuration.get('HOST') as string;
		const dashboardUrl: URL = new URL('/dashboard', clientUrl);
		const system: SystemDto = await this.systemService.findById(systemId);

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

	getAuthenticationUrl(oauthConfig: OauthConfig, state: string, migration: boolean): string {
		const redirectUri: string = this.getRedirectUri(migration);

		const authenticationUrl: URL = new URL(oauthConfig.authEndpoint);
		authenticationUrl.searchParams.append('client_id', oauthConfig.clientId);
		authenticationUrl.searchParams.append('redirect_uri', redirectUri);
		authenticationUrl.searchParams.append('response_type', oauthConfig.responseType);
		authenticationUrl.searchParams.append('scope', oauthConfig.scope);
		authenticationUrl.searchParams.append('state', state);
		if (oauthConfig.idpHint) {
			authenticationUrl.searchParams.append('kc_idp_hint', oauthConfig.idpHint);
		}

		return authenticationUrl.toString();
	}

	getRedirectUri(migration: boolean) {
		const publicBackendUrl: string = Configuration.get('PUBLIC_BACKEND_URL') as string;

		const path: string = migration ? 'api/v3/sso/oauth/migration' : 'api/v3/sso/oauth';
		const redirectUri: URL = new URL(path, publicBackendUrl);

		return redirectUri.toString();
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

	createErrorRedirect(errorCode: string): string {
		const redirect = new URL('/login', Configuration.get('HOST') as string);
		redirect.searchParams.append('error', errorCode);

		return redirect.toString();
	}
}
