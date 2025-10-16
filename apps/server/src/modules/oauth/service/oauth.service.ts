import { LegacyLogger } from '@core/logger';
import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { LegacySchoolService } from '@modules/legacy-school';
import { AuthenticationCodeGrantTokenRequest, OAuthTokenDto, OauthAdapterService } from '@modules/oauth-adapter';
import { TokenRequestMapper } from '@modules/oauth-adapter/mapper/token-request.mapper';
import { ProvisioningService } from '@modules/provisioning/service/provisioning.service';
import { SchoolFeature } from '@modules/school/domain';
import { SystemService } from '@modules/system';
import { OauthConfigEntity } from '@modules/system/repo';
import { UserDo, UserService } from '@modules/user';
import { MigrationCheckService } from '@modules/user-login-migration';
import { Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { isObject } from '@nestjs/common/utils/shared.utils';
import { EntityId } from '@shared/domain/types';
import jwt, { JwtPayload } from 'jsonwebtoken';
import {
	OauthConfigMissingLoggableException,
	TokenInvalidLoggableException,
	UserNotFoundAfterProvisioningLoggableException,
} from '../loggable';

@Injectable()
export class OAuthService {
	constructor(
		private readonly userService: UserService,
		private readonly oauthAdapterService: OauthAdapterService,
		@Inject(DefaultEncryptionService) private readonly oAuthEncryptionService: EncryptionService,
		private readonly logger: LegacyLogger,
		private readonly provisioningService: ProvisioningService,
		private readonly systemService: SystemService,
		private readonly migrationCheckService: MigrationCheckService,
		private readonly schoolService: LegacySchoolService
	) {
		this.logger.setContext(OAuthService.name);
	}

	public async authenticateUser(systemId: string, redirectUri: string, code: string): Promise<OAuthTokenDto> {
		const system = await this.systemService.findById(systemId);

		if (!system || !system.oauthConfig) {
			throw new OauthConfigMissingLoggableException(systemId);
		}
		const { oauthConfig } = system;

		const oauthTokens = await this.requestToken(code, oauthConfig, redirectUri);

		await this.validateToken(oauthTokens.idToken, oauthConfig);

		return oauthTokens;
	}

	public async provisionUser(systemId: string, idToken: string, accessToken: string): Promise<UserDo | null> {
		const data = await this.provisioningService.getData(systemId, idToken, accessToken);

		const externalUserId = data.externalUser.externalId;
		const officialSchoolNumber = data.externalSchool?.officialSchoolNumber;

		let isProvisioningEnabled = true;

		if (officialSchoolNumber) {
			isProvisioningEnabled = await this.isOauthProvisioningEnabledForSchool(officialSchoolNumber);

			const shouldUserMigrate = await this.migrationCheckService.shouldUserMigrate(
				externalUserId,
				systemId,
				officialSchoolNumber
			);

			if (shouldUserMigrate) {
				const existingUser = await this.userService.findByExternalId(externalUserId, systemId);

				if (!existingUser) {
					return null;
				}
			}
		}

		if (isProvisioningEnabled) {
			await this.provisioningService.provisionData(data);
		}

		const user: UserDo = await this.findUserAfterProvisioningOrThrow(externalUserId, systemId, officialSchoolNumber);

		return user;
	}

	private async findUserAfterProvisioningOrThrow(
		externalUserId: string,
		systemId: EntityId,
		officialSchoolNumber?: string
	): Promise<UserDo> {
		const user = await this.userService.findByExternalId(externalUserId, systemId);

		if (!user) {
			// This can happen, when OAuth2 provisioning is disabled, because the school doesn't have the feature.
			// OAuth2 provisioning is disabled for schools that don't have migrated, yet.
			throw new UserNotFoundAfterProvisioningLoggableException(externalUserId, systemId, officialSchoolNumber);
		}

		return user;
	}

	public async isOauthProvisioningEnabledForSchool(officialSchoolNumber: string): Promise<boolean> {
		const school = await this.schoolService.getSchoolBySchoolNumber(officialSchoolNumber);

		if (!school) {
			return true;
		}

		return !!school.features?.includes(SchoolFeature.OAUTH_PROVISIONING_ENABLED);
	}

	// private
	public async requestToken(code: string, oauthConfig: OauthConfigEntity, redirectUri: string): Promise<OAuthTokenDto> {
		const payload = this.buildTokenRequestPayload(code, oauthConfig, redirectUri);

		const tokenDto = await this.oauthAdapterService.sendTokenRequest(oauthConfig.tokenEndpoint, payload);

		return tokenDto;
	}

	// private
	public async validateToken(idToken: string, oauthConfig: OauthConfigEntity): Promise<JwtPayload> {
		const publicKey = await this.oauthAdapterService.getPublicKey(oauthConfig.jwksEndpoint);
		const decodedJWT = jwt.verify(idToken, publicKey, {
			algorithms: ['RS256'],
			issuer: oauthConfig.issuer,
			audience: oauthConfig.clientId,
		});

		if (typeof decodedJWT === 'string') {
			throw new TokenInvalidLoggableException();
		}

		return decodedJWT;
	}

	/**
	 * @see https://openid.net/specs/openid-connect-backchannel-1_0.html#Validation
	 */
	public async validateLogoutToken(logoutToken: string, oauthConfig: OauthConfigEntity): Promise<JwtPayload> {
		const validatedJwt: JwtPayload = await this.validateToken(logoutToken, oauthConfig);

		if (
			!isObject(validatedJwt.events) ||
			!Object.keys(validatedJwt.events).includes('http://schemas.openid.net/event/backchannel-logout')
		) {
			throw new TokenInvalidLoggableException();
		}

		if (validatedJwt.nonce !== undefined) {
			throw new TokenInvalidLoggableException();
		}

		return validatedJwt;
	}

	private buildTokenRequestPayload(
		code: string,
		oauthConfig: OauthConfigEntity,
		redirectUri: string
	): AuthenticationCodeGrantTokenRequest {
		const decryptedClientSecret: string = this.oAuthEncryptionService.decrypt(oauthConfig.clientSecret);

		const tokenRequestPayload = TokenRequestMapper.createAuthenticationCodeGrantTokenRequestPayload(
			oauthConfig.clientId,
			decryptedClientSecret,
			code,
			redirectUri
		);

		return tokenRequestPayload;
	}
}
