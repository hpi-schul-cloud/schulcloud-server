import { AuthenticationService } from '@modules/authentication/services/authentication.service';
import { Action, AuthorizationService } from '@modules/authorization';
import { OAuthTokenDto } from '@modules/oauth';
import { OAuthService } from '@modules/oauth/service/oauth.service';
import { ProvisioningService } from '@modules/provisioning';
import { OauthDataDto } from '@modules/provisioning/dto';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { EntityId, LegacySchoolDo, Page, Permission, User, UserLoginMigrationDO } from '@shared/domain';
import { LegacyLogger } from '@src/core/logger';
import { ExternalSchoolNumberMissingLoggableException } from '../loggable';
import { SchoolMigrationService, UserLoginMigrationService, UserMigrationService } from '../service';
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
			if (!data.externalSchool.officialSchoolNumber) {
				throw new ExternalSchoolNumberMissingLoggableException(data.externalSchool.externalId);
			}

			const schoolToMigrate: LegacySchoolDo | null = await this.schoolMigrationService.getSchoolForMigration(
				currentUserId,
				data.externalSchool.externalId,
				data.externalSchool.officialSchoolNumber
			);

			this.logMigrationInformation(
				currentUserId,
				`Found school with officialSchoolNumber (${data.externalSchool.officialSchoolNumber})`
			);

			if (schoolToMigrate) {
				await this.schoolMigrationService.migrateSchool(
					schoolToMigrate,
					data.externalSchool.externalId,
					targetSystemId
				);

				this.logMigrationInformation(currentUserId, undefined, data, data.system.systemId, schoolToMigrate);
			}
		}

		await this.userMigrationService.migrateUser(currentUserId, data.externalUser.externalId, targetSystemId);

		// TODO this.logMigrationInformation(currentUserId, `Successfully migrated user and redirects to ${migrationDto.redirect}`);

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
