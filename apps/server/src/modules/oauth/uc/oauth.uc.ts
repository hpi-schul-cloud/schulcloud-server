import { Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { EntityId, LegacySchoolDo, UserDO } from '@shared/domain';
import { ISession } from '@shared/domain/types/session';
import { LegacyLogger } from '@src/core/logger';
import { AuthenticationService } from '@modules/authentication/services/authentication.service';
import { ProvisioningService } from '@modules/provisioning';
import { OauthDataDto } from '@modules/provisioning/dto';
import { SystemService } from '@modules/system';
import { SystemDto } from '@modules/system/service/dto/system.dto';
import { UserService } from '@modules/user';
import { UserMigrationService } from '@modules/user-login-migration';
import { SchoolMigrationService } from '@modules/user-login-migration/service';
import { MigrationDto } from '@modules/user-login-migration/service/dto';
import { nanoid } from 'nanoid';
import { OauthCurrentUser } from '@modules/authentication/interface';
import { AuthorizationParams } from '../controller/dto';
import { OAuthTokenDto } from '../interface';
import { OAuthProcessDto } from '../service/dto';
import { OAuthService } from '../service/oauth.service';
import { OauthLoginStateDto } from './dto/oauth-login-state.dto';

/**
 * @deprecated remove after login via oauth moved to authentication module
 */
@Injectable()
export class OauthUc {
	constructor(
		private readonly oauthService: OAuthService,
		private readonly authenticationService: AuthenticationService,
		private readonly systemService: SystemService,
		private readonly provisioningService: ProvisioningService,
		private readonly userService: UserService,
		private readonly userMigrationService: UserMigrationService,
		private readonly schoolMigrationService: SchoolMigrationService,
		private readonly logger: LegacyLogger
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

		const system: SystemDto = await this.systemService.findById(systemId);
		if (!system.oauthConfig) {
			throw new UnprocessableEntityException(`Requested system ${systemId} has no oauth configured`);
		}

		const authenticationUrl: string = this.oauthService.getAuthenticationUrl(system.oauthConfig, state, migration);

		session.oauthLoginState = new OauthLoginStateDto({
			state,
			systemId,
			provider: system.oauthConfig.provider,
			postLoginRedirect,
			userLoginMigration: migration,
		});

		return authenticationUrl;
	}

	async processOAuthLogin(cachedState: OauthLoginStateDto, code?: string, error?: string): Promise<OAuthProcessDto> {
		const { state, systemId, postLoginRedirect, userLoginMigration } = cachedState;

		this.logger.debug(`Oauth login process started. [state: ${state}, system: ${systemId}]`);

		const redirectUri: string = this.oauthService.getRedirectUri(userLoginMigration);

		const tokenDto: OAuthTokenDto = await this.oauthService.authenticateUser(systemId, redirectUri, code, error);

		const { user, redirect }: { user?: UserDO; redirect: string } = await this.oauthService.provisionUser(
			systemId,
			tokenDto.idToken,
			tokenDto.accessToken,
			postLoginRedirect
		);

		this.logger.debug(`Generating jwt for user. [state: ${state}, system: ${systemId}]`);

		let jwt: string | undefined;
		if (user && user.id) {
			jwt = await this.getJwtForUser(user.id);
		}

		const response = new OAuthProcessDto({
			jwt,
			redirect,
		});

		return response;
	}

	async migrate(
		userJwt: string,
		currentUserId: string,
		query: AuthorizationParams,
		cachedState: OauthLoginStateDto
	): Promise<MigrationDto> {
		const { state, systemId, userLoginMigration } = cachedState;

		if (state !== query.state) {
			throw new UnauthorizedException(`Invalid state. Got: ${query.state} Expected: ${state}`);
		}

		const redirectUri: string = this.oauthService.getRedirectUri(userLoginMigration);

		const tokenDto: OAuthTokenDto = await this.oauthService.authenticateUser(
			systemId,
			redirectUri,
			query.code,
			query.error
		);

		const data: OauthDataDto = await this.provisioningService.getData(systemId, tokenDto.idToken, tokenDto.accessToken);

		if (data.externalSchool) {
			const schoolToMigrate: LegacySchoolDo | null = await this.schoolMigrationService.schoolToMigrate(
				currentUserId,
				data.externalSchool.externalId,
				data.externalSchool.officialSchoolNumber
			);
			if (schoolToMigrate) {
				await this.schoolMigrationService.migrateSchool(data.externalSchool.externalId, schoolToMigrate, systemId);
			}
		}

		const migrationDto: MigrationDto = await this.userMigrationService.migrateUser(
			currentUserId,
			data.externalUser.externalId,
			systemId
		);

		await this.authenticationService.removeJwtFromWhitelist(userJwt);

		return migrationDto;
	}

	private async getJwtForUser(userId: EntityId): Promise<string> {
		const oauthCurrentUser: OauthCurrentUser = await this.userService.getResolvedUser(userId);

		const { accessToken } = await this.authenticationService.generateJwt(oauthCurrentUser);

		return accessToken;
	}
}
