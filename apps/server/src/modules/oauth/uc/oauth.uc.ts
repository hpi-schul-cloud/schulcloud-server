import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { SystemService } from '@src/modules/system';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { UserMigrationDto } from '@src/modules/user-migration/service/dto/userMigration.dto';
import { AuthorizationParams, OauthTokenResponse } from '../controller/dto';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { FeathersJwtProvider } from '@src/modules/authorization';
import { OAuthProcessDto } from '../service/dto/oauth-process.dto';
import { OAuthService } from '../service/oauth.service';

/**
 * @deprecated remove after login via oauth moved to authentication module
 */
@Injectable()
export class OauthUc {
	constructor(
		private readonly oauthService: OAuthService,
		private readonly systemService: SystemService,
		private readonly jwtService: FeathersJwtProvider,
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

		const { user, redirect }: { user?: UserDO; redirect: string } = await this.oauthService.authenticateUser(
			systemId,
			authCode
		);

		let jwtResponse = '';
		if (user && user.id) {
			jwtResponse = await this.jwtService.generateJwt(user.id);
		}

		const response = new OAuthProcessDto({
			jwt: jwtResponse !== '' ? jwtResponse : undefined,
			redirect,
		});

		return response;
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
