import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { ISession } from '@shared/domain/types/session';
import { Logger } from '@src/core/logger';
import { SystemService } from '@src/modules/system';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { FeathersJwtProvider } from '@src/modules/authorization';
import { UserService } from '@src/modules/user';
import { UserMigrationService } from '@src/modules/user-login-migration';
import { SchoolService } from '@src/modules/school';
import { SchoolMigrationService } from '@src/modules/user-login-migration/service';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { MigrationDto } from '@src/modules/user-login-migration/service/dto/migration.dto';
import { ProvisioningService } from '@src/modules/provisioning';
import { OauthDataDto } from '@src/modules/provisioning/dto';
import { AuthorizationParams, OauthTokenResponse } from '../controller/dto';
import { UserMigrationService } from '@src/modules/user-migration';
import { nanoid } from 'nanoid';
import { OauthTokenResponse } from '../controller/dto';
import { OAuthSSOError } from '../error/oauth-sso.error';
import { SSOErrorCode } from '../error/sso-error-code.enum';
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
		private readonly jwtService: FeathersJwtProvider,
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
		if (!code) {
			throw new OAuthSSOError('Authorization in external system failed', error || SSOErrorCode.SSO_AUTH_CODE_STEP);
		}

		const { state, systemId, postLoginRedirect } = cachedState;

		this.logger.debug(`Oauth login process started. [state: ${state}, system: ${systemId}]`);

		const system: SystemDto = await this.systemService.findOAuthById(systemId);
		if (!system.oauthConfig) {
			throw new OAuthSSOError(`Requested system ${systemId} has no oauth configured`, SSOErrorCode.SSO_INTERNAL_ERROR);
		}
		const { oauthConfig } = system;

		this.logger.debug(`Requesting token from external system. [state: ${state}, system: ${systemId}]`);
		const queryToken: OauthTokenResponse = await this.oauthService.requestToken(code, oauthConfig);

		await this.oauthService.validateToken(queryToken.id_token, oauthConfig);

		this.logger.debug(`Fetching user data. [state: ${state}, system: ${systemId}]`);
		const data: OauthDataDto = await this.provisioningService.getData(
			queryToken.access_token,
			queryToken.id_token,
			systemId
		);

		if (data.externalSchool?.officialSchoolNumber) {
			const shouldMigrate: boolean = await this.shouldUserMigrate(
				data.externalUser.externalId,
				data.externalSchool.officialSchoolNumber,
				systemId
			);
			if (shouldMigrate) {
				this.logger.debug(
					`School is in Migration. Redirecting user to migration page. [state: ${state}, system: ${systemId}]`
				);
				const redirect: string = await this.userMigrationService.getMigrationRedirect(
					data.externalSchool.officialSchoolNumber,
					systemId
				);
				const response: OAuthProcessDto = new OAuthProcessDto({
					redirect,
				});
				return response;
			}
		}

		this.logger.debug(`Starting provisioning of user. [state: ${state}, system: ${systemId}]`);
		const provisioningDto: ProvisioningDto = await this.provisioningService.provisionData(data);

		const user: UserDO = await this.oauthService.findUser(
			queryToken.id_token,
			provisioningDto.externalUserId,
			systemId
		);

		this.logger.debug(`Generating jwt for user. [state: ${state}, system: ${systemId}]`);
		const jwtResponse: string = await this.oauthService.getJwtForUser(user.id as string);

		const redirect: string = this.oauthService.getPostLoginRedirectUrl(
			oauthConfig.provider,
			queryToken.id_token,
			oauthConfig.logoutEndpoint,
			postLoginRedirect
		);

		const response: OAuthProcessDto = new OAuthProcessDto({
			jwt: jwtResponse,
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
}
