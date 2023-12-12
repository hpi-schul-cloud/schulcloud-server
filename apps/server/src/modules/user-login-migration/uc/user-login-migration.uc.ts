import { AuthenticationService } from '@modules/authentication';
import { Action, AuthorizationService } from '@modules/authorization';
import { OAuthService, OAuthTokenDto } from '@modules/oauth';
import { OauthDataDto, ProvisioningService } from '@modules/provisioning';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { LegacySchoolDo, Page, UserLoginMigrationDO } from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import {
	ExternalSchoolNumberMissingLoggableException,
	InvalidUserLoginMigrationLoggableException,
	SchoolMigrationSuccessfulLoggable,
	UserMigrationStartedLoggable,
	UserMigrationSuccessfulLoggable,
} from '../loggable';
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
		private readonly logger: Logger
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
		currentUserId: EntityId,
		targetSystemId: EntityId,
		code: string,
		redirectUri: string
	): Promise<void> {
		const userLoginMigration: UserLoginMigrationDO | null = await this.userLoginMigrationService.findMigrationByUser(
			currentUserId
		);

		if (!userLoginMigration || userLoginMigration.closedAt || userLoginMigration.targetSystemId !== targetSystemId) {
			throw new InvalidUserLoginMigrationLoggableException(currentUserId, targetSystemId);
		}

		const tokenDto: OAuthTokenDto = await this.oauthService.authenticateUser(targetSystemId, redirectUri, code);

		this.logger.debug(new UserMigrationStartedLoggable(currentUserId, userLoginMigration));

		const data: OauthDataDto = await this.provisioningService.getData(
			targetSystemId,
			tokenDto.idToken,
			tokenDto.accessToken
		);

		if (data.externalSchool) {
			if (!data.externalSchool.officialSchoolNumber) {
				throw new ExternalSchoolNumberMissingLoggableException(data.externalSchool.externalId);
			}

			const schoolToMigrate: LegacySchoolDo | null = await this.schoolMigrationService.getSchoolForMigration(
				currentUserId,
				data.externalSchool.externalId,
				data.externalSchool.officialSchoolNumber
			);

			if (schoolToMigrate) {
				await this.schoolMigrationService.migrateSchool(
					schoolToMigrate,
					data.externalSchool.externalId,
					targetSystemId
				);

				this.logger.debug(new SchoolMigrationSuccessfulLoggable(schoolToMigrate, userLoginMigration));
			}
		}

		await this.userMigrationService.migrateUser(currentUserId, data.externalUser.externalId, targetSystemId);

		this.logger.debug(new UserMigrationSuccessfulLoggable(currentUserId, userLoginMigration));

		await this.authenticationService.removeJwtFromWhitelist(userJwt);
	}
}
