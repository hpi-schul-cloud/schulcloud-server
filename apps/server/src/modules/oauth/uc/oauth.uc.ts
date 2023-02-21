import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityId, OauthConfig } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { Logger } from '@src/core/logger';
import { ProvisioningDto, ProvisioningService } from '@src/modules/provisioning';
import { OauthDataDto } from '@src/modules/provisioning/dto/oauth-data.dto';
import { SystemService } from '@src/modules/system';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { UserService } from '@src/modules/user';
import { UserMigrationService } from '@src/modules/user-migration';
import { UserMigrationDto } from '@src/modules/user-migration/service/dto/userMigration.dto';
import { AuthorizationParams, OauthTokenResponse } from '../controller/dto';
import { OAuthSSOError } from '../error/oauth-sso.error';
import { OAuthProcessDto } from '../service/dto/oauth-process.dto';
import { OAuthService } from '../service/oauth.service';

@Injectable()
export class OauthUc {
	constructor(
		private readonly oauthService: OAuthService,
		private readonly systemService: SystemService,
		private readonly provisioningService: ProvisioningService,
		private readonly userService: UserService,
		private readonly userMigrationService: UserMigrationService,
		private readonly logger: Logger
	) {
		this.logger.setContext(OauthUc.name);
	}

	async processOAuth(query: AuthorizationParams, systemId: string): Promise<OAuthProcessDto> {
		try {
			const oAuthResponsePromise = this.process(query, systemId);
			return await oAuthResponsePromise;
		} catch (error) {
			return await this.getOauthErrorResponse(error, systemId);
		}
	}

	async migrateUser(
		currentUserId: string,
		query: AuthorizationParams,
		targetSystemId: string
	): Promise<UserMigrationDto> {
		const queryToken: OauthTokenResponse = await this.authorizeForMigration(query, targetSystemId);
		const data: OauthDataDto = await this.provisioningService.getData(
			queryToken.access_token,
			queryToken.id_token,
			targetSystemId
		);
		const migrationDto = this.userMigrationService.migrateUser(
			currentUserId,
			data.externalUser.externalId,
			targetSystemId
		);
		return migrationDto;
	}

	private async process(query: AuthorizationParams, systemId: string): Promise<OAuthProcessDto> {
		this.logger.debug(`Oauth process started for systemId ${systemId}`);

		const authCode: string = this.oauthService.checkAuthorizationCode(query);

		const system: SystemDto = await this.systemService.findOAuthById(systemId);
		if (!system.id) {
			throw new NotFoundException(`System with id "${systemId}" does not exist.`);
		}
		const oauthConfig: OauthConfig = this.extractOauthConfigFromSystem(system);

		const queryToken: OauthTokenResponse = await this.oauthService.requestToken(authCode, oauthConfig);

		await this.oauthService.validateToken(queryToken.id_token, oauthConfig);

		const data: OauthDataDto = await this.provisioningService.getData(
			queryToken.access_token,
			queryToken.id_token,
			system.id
		);

		if (data.externalSchool?.officialSchoolNumber) {
			const shouldMigrate: boolean = await this.shouldUserMigrate(
				data.externalUser.externalId,
				data.externalSchool.officialSchoolNumber,
				system.id
			);
			if (shouldMigrate) {
				const redirect: string = await this.userMigrationService.getMigrationRedirect(
					data.externalSchool.officialSchoolNumber,
					system.id
				);
				const response: OAuthProcessDto = new OAuthProcessDto({
					provider: oauthConfig.provider,
					redirect,
				});
				return response;
			}
		}

		const provisioningDto: ProvisioningDto = await this.provisioningService.provisionData(data);

		const user: UserDO = await this.oauthService.findUser(
			queryToken.id_token,
			provisioningDto.externalUserId,
			system.id
		);

		const jwtResponse: string = await this.oauthService.getJwtForUser(user.id as string);

		// TODO: N21-305 Build response in oauth controller
		const redirect: string = this.oauthService.getRedirectUrl(
			oauthConfig.provider,
			queryToken.id_token,
			oauthConfig.logoutEndpoint
		);
		const response: OAuthProcessDto = new OAuthProcessDto({
			jwt: jwtResponse,
			idToken: queryToken.id_token,
			logoutEndpoint: oauthConfig.logoutEndpoint,
			provider: oauthConfig.provider,
			redirect,
		});
		return response;
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
			throw new OAuthSSOError('Requested system has no oauth configured', 'sso_internal_error');
		}
		return oauthConfig;
	}

	private async getOauthErrorResponse(error, systemId: string): Promise<OAuthProcessDto> {
		const system: SystemDto = await this.systemService.findOAuthById(systemId);
		const provider: string = system.oauthConfig ? system.oauthConfig.provider : 'unknown-provider';
		const oAuthError: OAuthProcessDto = this.oauthService.getOAuthErrorResponse(error, provider);
		return oAuthError;
	}

	private async authorizeForMigration(query: AuthorizationParams, targetSystemId: string): Promise<OauthTokenResponse> {
		const authCode: string = this.oauthService.checkAuthorizationCode(query);

		const system: SystemDto = await this.systemService.findOAuthById(targetSystemId);
		if (!system.id) {
			throw new NotFoundException(`System with id "${targetSystemId}" does not exist.`);
		}
		const oauthConfig: OauthConfig = this.extractOauthConfigFromSystem(system);

		const migrationRedirect: string = this.userMigrationService.getMigrationRedirectUri(targetSystemId);
		const queryToken: OauthTokenResponse = await this.oauthService.requestToken(
			authCode,
			oauthConfig,
			migrationRedirect
		);

		await this.oauthService.validateToken(queryToken.id_token, oauthConfig);

		return queryToken;
	}
}
