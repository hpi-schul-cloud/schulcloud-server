import { AuthenticationService } from '@modules/authentication';
import { Action, AuthorizationService } from '@modules/authorization';
import { LegacySchoolService } from '@modules/legacy-school';
import { OAuthService, OAuthTokenDto } from '@modules/oauth';
import { OauthDataDto, ProvisioningService } from '@modules/provisioning';
import { UserService } from '@modules/user';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { LegacySchoolDo, Page, RoleReference, UserDO, UserLoginMigrationDO } from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import { Permission, RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import {
	ExternalSchoolNumberMissingLoggableException,
	InvalidUserLoginMigrationLoggableException,
	SchoolMigrationSuccessfulLoggable,
	UserLoginMigrationAlreadyClosedLoggableException,
	UserLoginMigrationMultipleEmailUsersLoggableException,
	UserMigrationStartedLoggable,
	UserMigrationSuccessfulLoggable,
	UserMigrationCorrectionSuccessfulLoggable,
	UserLoginMigrationInvalidExternalSchoolIdLoggableException,
	UserLoginMigrationSchoolAlreadyMigratedLoggableException,
	UserLoginMigrationInvalidAdminLoggableException,
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
		private readonly userService: UserService,
		private readonly schoolService: LegacySchoolService,
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
			throw new NotFoundLoggableException('UserLoginMigration', { schoolId });
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

		this.logger.info(new UserMigrationStartedLoggable(currentUserId, userLoginMigration));

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

				this.logger.info(new SchoolMigrationSuccessfulLoggable(schoolToMigrate, userLoginMigration));
			}
		}

		await this.userMigrationService.migrateUser(currentUserId, data.externalUser.externalId, targetSystemId);

		this.logger.info(new UserMigrationSuccessfulLoggable(currentUserId, userLoginMigration));

		await this.authenticationService.removeJwtFromWhitelist(userJwt);
	}

	async forceMigration(
		userId: EntityId,
		email: string,
		externalUserId: string,
		externalSchoolId: string
	): Promise<void> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkAllPermissions(user, [Permission.USER_LOGIN_MIGRATION_FORCE]);

		const schoolAdminUsers: UserDO[] = await this.userService.findByEmail(email);

		this.checkUserExists(schoolAdminUsers, email);

		const schoolAdminUser: UserDO = schoolAdminUsers[0];
		// TODO Use new domain object to always have an id
		if (!schoolAdminUser.id) {
			throw new NotFoundLoggableException('User', { email });
		}

		const isAdmin = !!schoolAdminUser.roles.find((value: RoleReference) => value.name === RoleName.ADMINISTRATOR);
		if (!isAdmin) {
			throw new UserLoginMigrationInvalidAdminLoggableException(schoolAdminUser.id);
		}

		const activeUserLoginMigration: UserLoginMigrationDO | null =
			await this.userLoginMigrationService.findMigrationBySchool(schoolAdminUser.schoolId);
		if (activeUserLoginMigration) {
			throw new UserLoginMigrationSchoolAlreadyMigratedLoggableException(activeUserLoginMigration.schoolId);
		}

		const userLoginMigration: UserLoginMigrationDO = await this.userLoginMigrationService.startMigration(
			schoolAdminUser.schoolId
		);

		const school: LegacySchoolDo = await this.schoolService.getSchoolById(schoolAdminUser.schoolId);

		const hasSchoolMigrated: boolean = this.schoolMigrationService.hasSchoolMigrated(
			school.externalId,
			externalSchoolId
		);
		if (hasSchoolMigrated) {
			throw new UserLoginMigrationSchoolAlreadyMigratedLoggableException(schoolAdminUser.schoolId);
		}

		await this.schoolMigrationService.migrateSchool(school, externalSchoolId, userLoginMigration.targetSystemId);

		this.logger.info(new SchoolMigrationSuccessfulLoggable(school, userLoginMigration));

		await this.userMigrationService.migrateUser(schoolAdminUser.id, externalUserId, userLoginMigration.targetSystemId);

		this.logger.info(new UserMigrationSuccessfulLoggable(schoolAdminUser.id, userLoginMigration));
	}

	async forceExtendedMigration(
		userId: EntityId,
		email: string,
		externalUserId: string,
		externalSchoolId: string
	): Promise<void> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkAllPermissions(user, [Permission.USER_LOGIN_MIGRATION_FORCE]);

		const users: UserDO[] = await this.userService.findByEmail(email);
		this.checkUserExists(users, email);

		const userToMigrate: UserDO = users[0];
		// TODO Use new domain object to always have an id
		if (!userToMigrate.id) {
			throw new NotFoundLoggableException('User', { email });
		}

		let activeUserLoginMigration: UserLoginMigrationDO | null =
			await this.userLoginMigrationService.findMigrationBySchool(userToMigrate.schoolId);

		if (!activeUserLoginMigration) {
			activeUserLoginMigration = await this.userLoginMigrationService.startMigration(userToMigrate.schoolId);
		}

		if (this.userLoginMigrationService.hasMigrationClosed(activeUserLoginMigration)) {
			throw new UserLoginMigrationAlreadyClosedLoggableException(
				<Date>activeUserLoginMigration.closedAt,
				activeUserLoginMigration.id
			);
		}

		const school: LegacySchoolDo = await this.schoolService.getSchoolById(userToMigrate.schoolId);

		const hasSchoolMigratedInCurrentMigration: boolean = this.schoolMigrationService.hasSchoolMigratedInMigrationPhase(
			school,
			activeUserLoginMigration
		);

		if (!hasSchoolMigratedInCurrentMigration) {
			await this.schoolMigrationService.migrateSchool(
				school,
				externalSchoolId,
				activeUserLoginMigration.targetSystemId
			);

			this.logger.info(new SchoolMigrationSuccessfulLoggable(school, activeUserLoginMigration));
		} else if (school.externalId !== externalSchoolId) {
			throw new UserLoginMigrationInvalidExternalSchoolIdLoggableException(externalSchoolId);
		}

		const hasUserMigrated: boolean = this.userMigrationService.hasUserMigratedInMigrationPhase(
			userToMigrate,
			activeUserLoginMigration
		);

		if (hasUserMigrated) {
			await this.userMigrationService.updateExternalUserId(userToMigrate.id, externalUserId);

			this.logger.info(new UserMigrationCorrectionSuccessfulLoggable(userToMigrate.id, activeUserLoginMigration));
		} else {
			await this.userMigrationService.migrateUser(
				userToMigrate.id,
				externalUserId,
				activeUserLoginMigration.targetSystemId
			);

			this.logger.info(new UserMigrationSuccessfulLoggable(userToMigrate.id, activeUserLoginMigration));
		}
	}

	private checkUserExists(users: UserDO[], email: string) {
		if (users.length === 0) {
			throw new NotFoundLoggableException('User', { email });
		}

		if (users.length > 1) {
			throw new UserLoginMigrationMultipleEmailUsersLoggableException(email);
		}
	}
}
