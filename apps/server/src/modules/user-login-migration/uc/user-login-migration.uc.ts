import { ForbiddenException, Injectable } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { EntityId, Page, Permission, LegacySchoolDo, User, UserLoginMigrationDO } from '@shared/domain';
import { LegacyLogger } from '@src/core/logger';
import { AuthenticationService } from '@src/modules/authentication/services/authentication.service';
import { Action, AuthorizationService } from '@src/modules/authorization';
import { OAuthTokenDto } from '@src/modules/oauth';
import { OAuthService } from '@src/modules/oauth/service/oauth.service';
import { ProvisioningService } from '@src/modules/provisioning';
import { OauthDataDto } from '@src/modules/provisioning/dto';
import { OAuthMigrationError, SchoolMigrationError, UserLoginMigrationError } from '../error';
import { PageTypes } from '../interface/page-types.enum';
import { SchoolMigrationService, UserLoginMigrationService, UserMigrationService } from '../service';
import { MigrationDto, PageContentDto } from '../service/dto';
import { UserLoginMigrationQuery } from './dto';

@Injectable()
export class UserLoginMigrationUc {
	constructor(
		private readonly userMigrationService: UserMigrationService,
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly oauthService: OAuthService,
		private readonly provisioningService: ProvisioningService,
		private readonly schoolMigrationService: SchoolMigrationService,
		private readonly authenticationService: AuthenticationService,
		private readonly authorizationService: AuthorizationService,
		private readonly logger: LegacyLogger
	) {}

	async getPageContent(pageType: PageTypes, sourceSystem: string, targetSystem: string): Promise<PageContentDto> {
		const content: PageContentDto = await this.userMigrationService.getPageContent(
			pageType,
			sourceSystem,
			targetSystem
		);

		return content;
	}

	async getMigrations(userId: EntityId, query: UserLoginMigrationQuery): Promise<Page<UserLoginMigrationDO>> {
		let page = new Page<UserLoginMigrationDO>([], 0);

		if (query.userId) {
			if (userId !== query.userId) {
				throw new ForbiddenException('Accessing migration status of another user is forbidden.');
			}

			const userLoginMigration: UserLoginMigrationDO | null = await this.userLoginMigrationService.findMigrationByUser(
				query.userId
			);

			if (userLoginMigration) {
				page = new Page<UserLoginMigrationDO>([userLoginMigration], 1);
			}
		}

		return page;
	}

	async findUserLoginMigrationBySchool(userId: EntityId, schoolId: EntityId): Promise<UserLoginMigrationDO> {
		const userLoginMigration: UserLoginMigrationDO | null = await this.userLoginMigrationService.findMigrationBySchool(
			schoolId
		);

		if (!userLoginMigration) {
			throw new NotFoundLoggableException('UserLoginMigration', 'schoolId', schoolId);
		}

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(user, userLoginMigration, {
			requiredPermissions: [Permission.USER_LOGIN_MIGRATION_ADMIN],
			action: Action.read,
		});

		return userLoginMigration;
	}

	async migrate(
		userJwt: string,
		currentUserId: string,
		targetSystemId: EntityId,
		code: string,
		redirectUri: string
	): Promise<void> {
		const tokenDto: OAuthTokenDto = await this.oauthService.authenticateUser(targetSystemId, redirectUri, code);

		this.logMigrationInformation(currentUserId, `Migrates to targetSystem with id ${targetSystemId}`);

		const data: OauthDataDto = await this.provisioningService.getData(
			targetSystemId,
			tokenDto.idToken,
			tokenDto.accessToken
		);

		this.logMigrationInformation(currentUserId, undefined, data, targetSystemId);

		if (data.externalSchool) {
			let schoolToMigrate: LegacySchoolDo | null;
			// TODO: N21-820 after fully switching to the new client login flow, try/catch will be obsolete and schoolToMigrate should throw correct errors
			try {
				schoolToMigrate = await this.schoolMigrationService.schoolToMigrate(
					currentUserId,
					data.externalSchool.externalId,
					data.externalSchool.officialSchoolNumber
				);
			} catch (error: unknown) {
				let details: Record<string, unknown> | undefined;

				if (
					error instanceof OAuthMigrationError &&
					error.officialSchoolNumberFromSource &&
					error.officialSchoolNumberFromTarget
				) {
					details = {
						sourceSchoolNumber: error.officialSchoolNumberFromSource,
						targetSchoolNumber: error.officialSchoolNumberFromTarget,
					};
				}

				throw new SchoolMigrationError(details, error);
			}

			this.logMigrationInformation(
				currentUserId,
				`Found school with officialSchoolNumber (${data.externalSchool.officialSchoolNumber ?? ''})`
			);

			if (schoolToMigrate) {
				await this.schoolMigrationService.migrateSchool(
					data.externalSchool.externalId,
					schoolToMigrate,
					targetSystemId
				);

				this.logMigrationInformation(currentUserId, undefined, data, data.system.systemId, schoolToMigrate);
			}
		}

		const migrationDto: MigrationDto = await this.userMigrationService.migrateUser(
			currentUserId,
			data.externalUser.externalId,
			targetSystemId
		);

		// TODO: N21-820 after implementation of new client login flow, redirects will be obsolete and migrate should throw errors directly
		if (migrationDto.redirect.includes('migration/error')) {
			throw new UserLoginMigrationError({ userId: currentUserId });
		}

		this.logMigrationInformation(currentUserId, `Successfully migrated user and redirects to ${migrationDto.redirect}`);

		await this.authenticationService.removeJwtFromWhitelist(userJwt);
	}

	private logMigrationInformation(
		userId: string,
		text?: string,
		oauthData?: OauthDataDto,
		targetSystemId?: string,
		school?: LegacySchoolDo
	) {
		let message = `MIGRATION (userId: ${userId}): ${text ?? ''}`;
		if (!school && oauthData) {
			message += `Provisioning data received from targetSystem (${targetSystemId ?? 'N/A'} with data: 
			{ 
				"officialSchoolNumber": ${oauthData.externalSchool?.officialSchoolNumber ?? 'N/A'},
				"externalSchoolId": ${oauthData.externalSchool?.externalId ?? ''}
				"externalUserId": ${oauthData.externalUser.externalId},
			})`;
		}
		if (school && oauthData) {
			message += `Successfully migrated school (${school.name} - (${school.id ?? 'N/A'}) to targetSystem ${
				targetSystemId ?? 'N/A'
			} which has the externalSchoolId ${oauthData.externalSchool?.externalId ?? 'N/A'}`;
		}
		this.logger.debug(message);
	}
}
