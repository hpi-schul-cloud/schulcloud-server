import { Injectable } from '@nestjs/common';
import { Permission, LegacySchoolDo, User, UserLoginMigrationDO } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { AuthorizationContext, AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { LegacySchoolService } from '@modules/legacy-school';
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
		private readonly schoolService: LegacySchoolService,
		private readonly logger: Logger
	) {}

	async setMigrationMandatory(userId: string, schoolId: string, mandatory: boolean): Promise<UserLoginMigrationDO> {
		await this.checkPermission(userId, schoolId);

		let userLoginMigration: UserLoginMigrationDO | null = await this.userLoginMigrationService.findMigrationBySchool(
			schoolId
		);

		if (!userLoginMigration) {
			throw new UserLoginMigrationNotFoundLoggableException(schoolId);
		} else if (userLoginMigration.finishedAt && Date.now() >= userLoginMigration.finishedAt.getTime()) {
			throw new UserLoginMigrationGracePeriodExpiredLoggableException(
				userLoginMigration.id as string,
				userLoginMigration.finishedAt
			);
		} else if (userLoginMigration.closedAt) {
			throw new UserLoginMigrationAlreadyClosedLoggableException(
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
		const school: LegacySchoolDo = await this.schoolService.getSchoolById(schoolId);

		const context: AuthorizationContext = AuthorizationContextBuilder.write([Permission.USER_LOGIN_MIGRATION_ADMIN]);
		this.authorizationService.checkPermission(user, school, context);
	}
}
