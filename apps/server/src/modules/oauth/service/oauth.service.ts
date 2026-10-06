import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { LegacyLogger } from '@infra/logger';
import {
	AuthenticationCodeGrantTokenRequest,
	OAuthTokenDto,
	OauthAdapterService,
	TokenRequestMapper,
} from '@infra/oauth-adapter';
import { ErwinIdentifierService, ReferencedEntityType } from '@modules/erwin-identifier';
import { LegacySchoolService } from '@modules/legacy-school';
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
		private readonly schoolService: LegacySchoolService,
		private readonly erwinIdentifierService: ErwinIdentifierService
	) {
		this.logger.setContext(OAuthService.name);
	}

	public async authenticateUser(systemId: string, redirectUri: string, code: string): Promise<OAuthTokenDto> {
		this.logger.log('OAuth2 starting external user authentication');
		this.logger.log('OAuth2 starting OAuth system configuration load');
		const system = await this.systemService.findById(systemId);
		this.logger.log('OAuth2 finished OAuth system configuration load');

		if (!system || !system.oauthConfig) {
			throw new OauthConfigMissingLoggableException(systemId);
		}
		const { oauthConfig } = system;

		this.logger.log('OAuth2 starting authorization code exchange');
		const oauthTokens = await this.requestToken(code, oauthConfig, redirectUri);
		this.logger.log('OAuth2 finished authorization code exchange');

		this.logger.log('OAuth2 starting ID token validation');
		await this.validateToken(oauthTokens.idToken, oauthConfig);
		this.logger.log('OAuth2 finished ID token validation');

		this.logger.log('OAuth2 finished external user authentication');
		return oauthTokens;
	}

	public async provisionUser(systemId: string, idToken: string, accessToken: string): Promise<UserDo | null> {
		let userId: string | undefined;

		this.logger.log('OAuth2 starting user provisioning');
		this.logger.log('OAuth2 starting external provisioning data fetch');
		const data = await this.provisioningService.getData(systemId, idToken, accessToken);
		const externalUserId = data.externalUser.externalId;
		this.logger.log(
			`OAuth2 finished external provisioning data fetch${this.formatUserIdentifier(externalUserId, userId)}`
		);

		const officialSchoolNumber = data.externalSchool?.officialSchoolNumber;
		const { erwinId } = data.externalUser;

		let isProvisioningEnabled = true;

		if (officialSchoolNumber) {
			this.logger.log(
				`OAuth2 starting school OAuth provisioning check${this.formatUserIdentifier(externalUserId, userId)}`
			);
			isProvisioningEnabled = await this.isOauthProvisioningEnabledForSchool(officialSchoolNumber);
			this.logger.log(
				`OAuth2 finished school OAuth provisioning check${this.formatUserIdentifier(externalUserId, userId)}`
			);

			this.logger.log(`OAuth2 starting user migration state check${this.formatUserIdentifier(externalUserId, userId)}`);
			const shouldUserMigrate = await this.migrationCheckService.shouldUserMigrate(
				externalUserId,
				systemId,
				officialSchoolNumber
			);
			this.logger.log(`OAuth2 finished user migration state check${this.formatUserIdentifier(externalUserId, userId)}`);

			if (shouldUserMigrate) {
				this.logger.log(
					`OAuth2 starting migrating OAuth user lookup${this.formatUserIdentifier(externalUserId, userId)}`
				);
				const existingUser = await this.userService.findByExternalId(externalUserId, systemId);
				this.logger.log(
					`OAuth2 finished migrating OAuth user lookup${this.formatUserIdentifier(externalUserId, userId)}`
				);

				if (!existingUser) {
					return null;
				}
			}
		}

		if (isProvisioningEnabled) {
			this.logger.log(
				`OAuth2 starting provisioned data persistence${this.formatUserIdentifier(externalUserId, userId)}`
			);
			await this.provisioningService.provisionData(data);
			this.logger.log(
				`OAuth2 finished provisioned data persistence${this.formatUserIdentifier(externalUserId, userId)}`
			);
		}

		this.logger.log(
			`OAuth2 starting provisioned OAuth user lookup${this.formatUserIdentifier(externalUserId, userId)}`
		);
		const user: UserDo = await this.findUserAfterProvisioningOrThrow(
			externalUserId,
			systemId,
			officialSchoolNumber,
			erwinId
		);
		userId = user.id;
		this.logger.log(
			`OAuth2 finished provisioned OAuth user lookup${this.formatUserIdentifier(externalUserId, userId)}`
		);

		this.logger.log(`OAuth2 finished user provisioning${this.formatUserIdentifier(externalUserId, userId)}`);
		return user;
	}

	private formatUserIdentifier(externalUserId?: string, userId?: string): string {
		const identifiers = [
			externalUserId ? `externalUserId=${externalUserId}` : undefined,
			userId ? `userId=${userId}` : undefined,
		].filter((identifier): identifier is string => Boolean(identifier));

		return identifiers.length ? ` [${identifiers.join(' ')}]` : '';
	}

	private async findUserAfterProvisioningOrThrow(
		externalUserId: string,
		systemId: EntityId,
		officialSchoolNumber?: string,
		erwinId?: string
	): Promise<UserDo> {
		if (erwinId) {
			const userByErwinId = await this.findUserByErwinId(erwinId);

			if (userByErwinId) {
				return userByErwinId;
			}
		}

		const user = await this.userService.findByExternalId(externalUserId, systemId);

		if (!user) {
			// This can happen, when OAuth2 provisioning is disabled, because the school doesn't have the feature.
			// OAuth2 provisioning is disabled for schools that don't have migrated, yet.
			throw new UserNotFoundAfterProvisioningLoggableException(externalUserId, systemId, officialSchoolNumber);
		}

		return user;
	}

	private async findUserByErwinId(erwinId: string): Promise<UserDo | null> {
		const erwinIdentifier = await this.erwinIdentifierService.findByErwinId(erwinId);

		if (!erwinIdentifier || erwinIdentifier.type !== ReferencedEntityType.USER) {
			return null;
		}
		const userByErwinId = await this.userService.findByIdOrNull(erwinIdentifier.referencedEntityId);

		return userByErwinId;
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
