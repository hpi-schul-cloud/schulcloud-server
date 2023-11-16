import { DefaultEncryptionService, IEncryptionService } from '@infra/encryption';
import { LegacySchoolService } from '@modules/legacy-school';
import { ProvisioningService, OauthDataDto } from '@modules/provisioning';
import { SystemService } from '@modules/system';
import { SystemDto } from '@modules/system/service';
import { UserService } from '@modules/user';
import { MigrationCheckService } from '@modules/user-login-migration';
import { Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { EntityId, LegacySchoolDo, OauthConfig, SchoolFeatures, UserDO } from '@shared/domain';
import { LegacyLogger } from '@src/core/logger';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { OAuthTokenDto } from '../interface';
import { OAuthSSOError, SSOErrorCode, UserNotFoundAfterProvisioningLoggableException } from '../loggable';
import { TokenRequestMapper } from '../mapper/token-request.mapper';
import { AuthenticationCodeGrantTokenRequest, OauthTokenResponse } from './dto';
import { OauthAdapterService } from './oauth-adapter.service';

@Injectable()
export class OAuthService {
	constructor(
		private readonly userService: UserService,
		private readonly oauthAdapterService: OauthAdapterService,
		@Inject(DefaultEncryptionService) private readonly oAuthEncryptionService: IEncryptionService,
		private readonly logger: LegacyLogger,
		private readonly provisioningService: ProvisioningService,
		private readonly systemService: SystemService,
		private readonly migrationCheckService: MigrationCheckService,
		private readonly schoolService: LegacySchoolService
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

	async provisionUser(systemId: string, idToken: string, accessToken: string): Promise<UserDO | null> {
		const data: OauthDataDto = await this.provisioningService.getData(systemId, idToken, accessToken);

		const externalUserId: string = data.externalUser.externalId;
		const officialSchoolNumber: string | undefined = data.externalSchool?.officialSchoolNumber;

		let isProvisioningEnabled = true;

		if (officialSchoolNumber) {
			isProvisioningEnabled = await this.isOauthProvisioningEnabledForSchool(officialSchoolNumber);

			const shouldUserMigrate: boolean = await this.migrationCheckService.shouldUserMigrate(
				externalUserId,
				systemId,
				officialSchoolNumber
			);

			if (shouldUserMigrate) {
				const existingUser: UserDO | null = await this.userService.findByExternalId(externalUserId, systemId);

				if (!existingUser) {
					return null;
				}
			}
		}

		if (isProvisioningEnabled) {
			await this.provisioningService.provisionData(data);
		}

		const user: UserDO = await this.findUserAfterProvisioningOrThrow(externalUserId, systemId, officialSchoolNumber);

		return user;
	}

	private async findUserAfterProvisioningOrThrow(
		externalUserId: string,
		systemId: EntityId,
		officialSchoolNumber?: string
	): Promise<UserDO> {
		const user: UserDO | null = await this.userService.findByExternalId(externalUserId, systemId);

		if (!user) {
			// This can happen, when OAuth2 provisioning is disabled, because the school doesn't have the feature.
			// OAuth2 provisioning is disabled for schools that don't have migrated, yet.
			throw new UserNotFoundAfterProvisioningLoggableException(externalUserId, systemId, officialSchoolNumber);
		}

		return user;
	}

	async isOauthProvisioningEnabledForSchool(officialSchoolNumber: string): Promise<boolean> {
		const school: LegacySchoolDo | null = await this.schoolService.getSchoolBySchoolNumber(officialSchoolNumber);

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
}
