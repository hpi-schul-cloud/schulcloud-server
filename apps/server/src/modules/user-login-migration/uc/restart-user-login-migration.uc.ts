import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Permission, SchoolDO, User, UserLoginMigrationDO } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { AuthorizationContext, AuthorizationContextBuilder, AuthorizationService } from '@src/modules/authorization';
import { LegacySchoolService } from '@src/modules/school';
import {
	UserLoginMigrationGracePeriodExpiredLoggableException,
	UserLoginMigrationNotFoundLoggableException,
} from '../error';
import { UserLoginMigrationStartLoggable } from '../loggable';
import { UserLoginMigrationService } from '../service';

@Injectable()
export class RestartUserLoginMigrationUc {
	constructor(
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly authorizationService: AuthorizationService,
		private readonly schoolService: LegacySchoolService,
		private readonly logger: Logger
	) {
		this.logger.setContext(RestartUserLoginMigrationUc.name);
	}

	async restartMigration(userId: string, schoolId: string): Promise<UserLoginMigrationDO> {
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
			userLoginMigration = await this.userLoginMigrationService.restartMigration(schoolId);

			this.logger.info(new UserLoginMigrationStartLoggable(userId, schoolId));
		} else {
			// Do nothing, if migration is already started but not stopped.
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
