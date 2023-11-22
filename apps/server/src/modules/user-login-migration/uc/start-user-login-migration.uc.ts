import { AuthorizationContext, AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { LegacySchoolService } from '@modules/legacy-school';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { EntityId, Permission, User } from '@shared/domain';
import { LegacySchoolDo, UserLoginMigrationDO } from '@shared/domain/domainobject';
import { Logger } from '@src/core/logger';
import {
	SchoolNumberMissingLoggableException,
	UserLoginMigrationAlreadyClosedLoggableException,
	UserLoginMigrationStartLoggable,
} from '../loggable';
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

	async startMigration(userId: EntityId, schoolId: EntityId): Promise<UserLoginMigrationDO> {
		await this.checkPreconditions(userId, schoolId);

		let userLoginMigration: UserLoginMigrationDO | null = await this.userLoginMigrationService.findMigrationBySchool(
			schoolId
		);

		if (!userLoginMigration) {
			userLoginMigration = await this.userLoginMigrationService.startMigration(schoolId);

			this.logger.info(new UserLoginMigrationStartLoggable(userId, userLoginMigration.id));
		} else if (userLoginMigration.closedAt) {
			throw new UserLoginMigrationAlreadyClosedLoggableException(userLoginMigration.closedAt, userLoginMigration.id);
		}

		return userLoginMigration;
	}

	private async checkPreconditions(userId: string, schoolId: string): Promise<void> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const school: LegacySchoolDo = await this.schoolService.getSchoolById(schoolId);

		const context: AuthorizationContext = AuthorizationContextBuilder.write([Permission.USER_LOGIN_MIGRATION_ADMIN]);
		this.authorizationService.checkPermission(user, school, context);

		if (!school.officialSchoolNumber) {
			throw new SchoolNumberMissingLoggableException(schoolId);
		}
	}
}
