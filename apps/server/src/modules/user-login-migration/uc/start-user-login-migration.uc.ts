import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Permission, LegacySchoolDo, User, UserLoginMigrationDO } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { AuthorizationContext, AuthorizationContextBuilder, AuthorizationService } from '@src/modules/authorization';
import { LegacySchoolService } from '@src/modules/legacy-school';
import { SchoolNumberMissingLoggableException, UserLoginMigrationAlreadyClosedLoggableException } from '../error';
import { UserLoginMigrationStartLoggable } from '../loggable';
import { UserLoginMigrationService } from '../service';

@Injectable()
export class StartUserLoginMigrationUc {
	constructor(
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly authorizationService: AuthorizationService,
		private readonly schoolService: LegacySchoolService,
		private readonly logger: Logger
	) {
		this.logger.setContext(StartUserLoginMigrationUc.name);
	}

	async startMigration(userId: string, schoolId: string): Promise<UserLoginMigrationDO> {
		await this.checkPreconditions(userId, schoolId);

		let userLoginMigration: UserLoginMigrationDO | null = await this.userLoginMigrationService.findMigrationBySchool(
			schoolId
		);

		if (!userLoginMigration) {
			userLoginMigration = await this.userLoginMigrationService.startMigration(schoolId);

			this.logger.info(new UserLoginMigrationStartLoggable(userId, userLoginMigration.id as string));
		} else if (userLoginMigration.closedAt) {
			throw new UserLoginMigrationAlreadyClosedLoggableException(
				userLoginMigration.id as string,
				userLoginMigration.closedAt
			);
		} else {
			// Do nothing, if migration is already started but not stopped.
		}

		return userLoginMigration;
	}

	async checkPreconditions(userId: string, schoolId: string): Promise<void> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const school: LegacySchoolDo = await this.schoolService.getSchoolById(schoolId);

		const context: AuthorizationContext = AuthorizationContextBuilder.write([Permission.USER_LOGIN_MIGRATION_ADMIN]);
		this.authorizationService.checkPermission(user, school, context);

		if (!school.officialSchoolNumber) {
			throw new SchoolNumberMissingLoggableException(schoolId);
		}
	}
}
