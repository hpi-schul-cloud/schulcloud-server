import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { ISession } from '@shared/domain/types/session';
import { Logger } from '@src/core/logger';
import { SystemService } from '@src/modules/system';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { UserService } from '@src/modules/user';
import { UserMigrationService } from '@src/modules/user-login-migration';
import { SchoolService } from '@src/modules/school';
import { SchoolMigrationService } from '@src/modules/user-login-migration/service';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { MigrationDto } from '@src/modules/user-login-migration/service/dto/migration.dto';
import { ProvisioningService } from '@src/modules/provisioning';
import { OauthDataDto } from '@src/modules/provisioning/dto';
import { nanoid } from 'nanoid';
import { AuthorizationParams, OauthTokenResponse } from '../controller/dto';
import { OAuthProcessDto } from '../service/dto/oauth-process.dto';
import { OAuthService } from '../service/oauth.service';
import { OauthLoginStateDto } from './dto/oauth-login-state.dto';

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
		private readonly schoolMigrationService: SchoolMigrationService,
		private readonly logger: Logger
	) {
		this.logger.setContext(OauthUc.name);
	}

	async startOauthLogin(
		session: ISession,
		systemId: EntityId,
		migration: boolean,
		postLoginRedirect?: string
	): Promise<string> {
		const state = nanoid(16);

		const system: SystemDto = await this.systemService.findOAuthById(systemId);
		if (!system.oauthConfig) {
			throw new UnprocessableEntityException(`Requested system ${systemId} has no oauth configured`);
		}

		const authenticationUrl: string = this.oauthService.getAuthenticationUrl(
			system.type,
			system.oauthConfig,
			state,
			migration,
			system.alias
		);

		session.oauthLoginState = new OauthLoginStateDto({
			state,
			systemId,
			provider: system.oauthConfig.provider,
			postLoginRedirect,
		});

		return authenticationUrl;
	}

	async processOAuthLogin(cachedState: OauthLoginStateDto, code?: string, error?: string): Promise<OAuthProcessDto> {
		const { state, systemId, postLoginRedirect } = cachedState;

		this.logger.debug(`Oauth login process started. [state: ${state}, system: ${systemId}]`);

		const { user, redirect }: { user?: UserDO; redirect: string } = await this.oauthService.authenticateUser(
			systemId,
			code,
			error,
			postLoginRedirect
		);

		this.logger.debug(`Generating jwt for user. [state: ${state}, system: ${systemId}]`);

		let jwtResponse = '';
		if (user && user.id) {
			jwtResponse = await this.oauthService.getJwtForUser(user.id);
		}

		const response = new OAuthProcessDto({
			jwt: jwtResponse !== '' ? jwtResponse : undefined,
			redirect,
		});

		return response;
	}

	async migrate(currentUserId: string, query: AuthorizationParams, targetSystemId: string): Promise<MigrationDto> {
		const queryToken: OauthTokenResponse = await this.oauthService.authorizeForMigration(query, targetSystemId);
		const data: OauthDataDto = await this.provisioningService.getData(
			queryToken.access_token,
			queryToken.id_token,
			targetSystemId
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
}
