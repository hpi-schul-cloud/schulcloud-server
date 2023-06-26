import { Injectable } from '@nestjs/common';
import { Permission, SchoolDO, User, UserLoginMigrationDO } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { AuthorizationContext, AuthorizationContextBuilder, AuthorizationService } from '@src/modules/authorization';
import { SchoolService } from '@src/modules/school';
import {
	UserLoginMigrationAlreadyClosedLoggableException,
	UserLoginMigrationGracePeriodExpiredLoggableException,
	UserLoginMigrationNotFoundLoggableException,
} from '../error';
import { UserLoginMigrationMandatoryLoggable } from '../loggable';
import { UserLoginMigrationService } from '../service';

@Injectable()
export class ToggleUserLoginMigrationUc {
	constructor(
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly authorizationService: AuthorizationService,
		private readonly schoolService: SchoolService,
		private readonly logger: Logger
	) {}

	async setMigrationMandatory(userId: string, schoolId: string, mandatory: boolean): Promise<UserLoginMigrationDO> {
		await this.checkPermission(userId, schoolId);

		let userLoginMigration: UserLoginMigrationDO | null = await this.userLoginMigrationService.findMigrationBySchool(
			schoolId
		);

		if (!userLoginMigration) {
			throw new UserLoginMigrationNotFoundLoggableException(userId, schoolId);
		} else if (userLoginMigration.finishedAt && Date.now() >= userLoginMigration.finishedAt.getTime()) {
			throw new UserLoginMigrationGracePeriodExpiredLoggableException(
				userId,
				userLoginMigration.id as string,
				userLoginMigration.finishedAt
			);
		} else if (userLoginMigration.closedAt) {
			throw new UserLoginMigrationAlreadyClosedLoggableException(
				userId,
				userLoginMigration.id as string,
				userLoginMigration.closedAt
			);
		} else {
			userLoginMigration = await this.userLoginMigrationService.setMigrationMandatory(schoolId, mandatory);

			this.logger.debug(new UserLoginMigrationMandatoryLoggable(userId, userLoginMigration.id as string, mandatory));
		}

		return userLoginMigration;
	}

	async checkPermission(userId: string, schoolId: string): Promise<void> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const school: SchoolDO = await this.schoolService.getSchoolById(schoolId);

		const context: AuthorizationContext = AuthorizationContextBuilder.write([Permission.USER_LOGIN_MIGRATION_ADMIN]);
		this.authorizationService.checkPermission(user, school, context);
	}
}
