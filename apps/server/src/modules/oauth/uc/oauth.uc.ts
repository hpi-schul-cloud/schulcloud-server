import { Injectable } from '@nestjs/common';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { Logger } from '@src/core/logger';
import { FeathersJwtProvider } from '@src/modules/authorization';
import { ProvisioningService } from '@src/modules/provisioning';
import { OauthDataDto } from '@src/modules/provisioning/dto';
import { SchoolService } from '@src/modules/school';
import { SystemService } from '@src/modules/system';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { UserService } from '@src/modules/user';
import { UserMigrationService } from '@src/modules/user-login-migration';
import { SchoolMigrationService } from '@src/modules/user-login-migration/service';
import { MigrationDto } from '@src/modules/user-login-migration/service/dto/migration.dto';
import { AuthorizationParams } from '../controller/dto';
import { OAuthTokenDto } from '../interface';
import { OAuthProcessDto } from '../service/dto';
import { OAuthService } from '../service/oauth.service';

/**
 * @deprecated remove after login via oauth moved to authentication module
 */
@Injectable()
export class OauthUc {
	constructor(
		private readonly oauthService: OAuthService,
		private readonly systemService: SystemService,
		private readonly provisioningService: ProvisioningService,
		private readonly schoolService: SchoolService,
		private readonly userService: UserService,
		private readonly userMigrationService: UserMigrationService,
		private readonly jwtService: FeathersJwtProvider,
		private readonly schoolMigrationService: SchoolMigrationService,
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

	async migrate(currentUserId: string, query: AuthorizationParams, targetSystemId: string): Promise<MigrationDto> {
		const tokenDto: OAuthTokenDto = await this.oauthService.authenticateUser(targetSystemId, query.code, query.error);

		const data: OauthDataDto = await this.provisioningService.getData(
			targetSystemId,
			tokenDto.idToken,
			tokenDto.accessToken
		);

		if (data.externalSchool) {
			const schoolToMigrate: SchoolDO | null = await this.schoolMigrationService.schoolToMigrate(
				currentUserId,
				data.externalSchool.externalId,
				data.externalSchool.officialSchoolNumber
			);
			if (schoolToMigrate) {
				await this.schoolMigrationService.migrateSchool(
					data.externalSchool.externalId,
					schoolToMigrate,
					targetSystemId
				);
			}
		}

		const migrationDto: Promise<MigrationDto> = this.userMigrationService.migrateUser(
			currentUserId,
			data.externalUser.externalId,
			targetSystemId
		);
		return migrationDto;
	}

	private async process(query: AuthorizationParams, systemId: string): Promise<OAuthProcessDto> {
		this.logger.debug(`Oauth process started for systemId ${systemId}`);

		const tokenDto: OAuthTokenDto = await this.oauthService.authenticateUser(systemId, query.code, query.error);

		const { user, redirect }: { user?: UserDO; redirect: string } = await this.oauthService.provisionUser(
			systemId,
			tokenDto.idToken,
			tokenDto.accessToken
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
}
