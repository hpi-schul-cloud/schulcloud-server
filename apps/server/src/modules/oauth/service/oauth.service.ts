import { BadRequestException, Inject, UnauthorizedException } from '@nestjs/common';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { EntityId, OauthConfig, User } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { DefaultEncryptionService, IEncryptionService } from '@shared/infra/encryption';
import { Logger } from '@src/core/logger';
import { UserService } from '@src/modules/user';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Configuration } from '@hpi-schul-cloud/commons';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { ProvisioningDto, ProvisioningService } from '@src/modules/provisioning';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { UserMigrationService } from '@src/modules/user-login-migration';
import { SystemService } from '@src/modules/system';
import { OauthDataDto } from '@src/modules/provisioning/dto';
import { AuthorizationParams, OauthTokenResponse, TokenRequestPayload } from '../controller/dto';
import { OAuthSSOError } from '../error/oauth-sso.error';
import { SSOErrorCode } from '../error/sso-error-code.enum';
import { IJwt } from '../interface/jwt.base.interface';
import { OauthAdapterService } from './oauth-adapter.service';
import { TokenRequestMapper } from '../mapper/token-request.mapper';

@Injectable()
export class OAuthService {
	constructor(
		private readonly userService: UserService,
		private readonly oauthAdapterService: OauthAdapterService,
		@Inject(DefaultEncryptionService) private readonly oAuthEncryptionService: IEncryptionService,
		private readonly logger: Logger,
		private readonly provisioningService: ProvisioningService,
		private readonly systemService: SystemService,
		private readonly userMigrationService: UserMigrationService
	) {
		this.logger.setContext(OAuthService.name);
	}

	async authenticateUser(
		systemId: string,
		authCode?: string,
		errorCode?: string,
		postLoginRedirect?: string
	): Promise<{ user?: UserDO; redirect: string }> {
		let redirect: string;
		if (errorCode) {
			redirect = this.createErrorRedirect(errorCode);
			return { user: undefined, redirect };
		}
		if (!authCode) {
			throw new OAuthSSOError(
				'Authorization Query Object has no authorization code or error',
				errorCode || 'sso_auth_code_step'
			);
		}

		const system = await this.systemService.findOAuthById(systemId);
		if (!system.id) {
			// unreachable. System loaded from DB always has an ID
			throw new UnauthorizedException(`System with id "${systemId}" does not exist.`);
		}

		const oauthConfig: OauthConfig = this.extractOauthConfigFromSystem(system);

		const queryToken: OauthTokenResponse = await this.requestToken(authCode, oauthConfig);

		await this.validateToken(queryToken.id_token, oauthConfig);

		const data: OauthDataDto = await this.provisioningService.getData(
			queryToken.access_token,
			queryToken.id_token,
			system.id
		);

		// TODO Move Migration Checks to other service
		if (data.externalSchool?.officialSchoolNumber) {
			const shouldMigrate: boolean = await this.shouldUserMigrate(
				data.externalUser.externalId,
				data.externalSchool.officialSchoolNumber,
				system.id
			);
			if (shouldMigrate) {
				redirect = await this.userMigrationService.getMigrationRedirect(
					data.externalSchool.officialSchoolNumber,
					system.id
				);
				return { user: undefined, redirect };
			}
		}

		redirect = this.getPostLoginRedirectUrl(
			oauthConfig.provider,
			queryToken.id_token,
			oauthConfig.logoutEndpoint,
			postLoginRedirect
		);

		const provisioningDto: ProvisioningDto = await this.provisioningService.provisionData(data);

		const user: UserDO = await this.findUser(queryToken.id_token, provisioningDto.externalUserId, system.id);

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

	async requestToken(code: string, oauthConfig: OauthConfig, migrationRedirect?: string): Promise<OauthTokenResponse> {
		const payload: TokenRequestPayload = this.buildTokenRequestPayload(code, oauthConfig, migrationRedirect);
		const responseToken = this.oauthAdapterService.sendTokenRequest(payload);
		return responseToken;
	}

	async validateToken(idToken: string, oauthConfig: OauthConfig): Promise<IJwt> {
		const publicKey = await this.oauthAdapterService.getPublicKey(oauthConfig);
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

	async findUser(idToken: string, externalUserId: string, systemId: EntityId): Promise<UserDO> {
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

	async getAdditionalErrorInfo(email: string | undefined): Promise<string> {
		if (email) {
			const usersWithEmail: User[] = await this.userService.findByEmail(email);
			const user = usersWithEmail && usersWithEmail.length > 0 ? usersWithEmail[0] : undefined;
			return ` [schoolId: ${user?.school.id ?? ''}, currentLdapId: ${user?.externalId ?? ''}]`;
		}
		return '';
	}

	async authorizeForMigration(query: AuthorizationParams, targetSystemId: string): Promise<OauthTokenResponse> {
		const authCode: string = this.checkAuthorizationCode(query);

		const system: SystemDto = await this.systemService.findOAuthById(targetSystemId);
		if (!system.id) {
			throw new NotFoundException(`System with id "${targetSystemId}" does not exist.`);
		}
		const oauthConfig: OauthConfig = this.extractOauthConfigFromSystem(system);

		const migrationRedirect: string = this.userMigrationService.getMigrationRedirectUri(targetSystemId);
		const queryToken: OauthTokenResponse = await this.requestToken(authCode, oauthConfig, migrationRedirect);

		await this.validateToken(queryToken.id_token, oauthConfig);

		return queryToken;
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

	private async shouldUserMigrate(externalUserId: string, officialSchoolNumber: string, systemId: EntityId) {
		const existingUser: UserDO | null = await this.userService.findByExternalId(externalUserId, systemId);
		const isSchoolInMigration: boolean = await this.userMigrationService.isSchoolInMigration(officialSchoolNumber);

		const shouldMigrate = !existingUser && isSchoolInMigration;
		return shouldMigrate;
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

	private createErrorRedirect(errorCode: string): string {
		const redirect = new URL('/login', Configuration.get('HOST') as string);
		redirect.searchParams.append('error', errorCode);
		return redirect.toString();
	}
}
