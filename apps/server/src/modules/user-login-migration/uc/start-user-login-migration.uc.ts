import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { LegacySchoolDo } from '@shared/domain/domainobject/legacy-school.do';
import { UserLoginMigrationDO } from '@shared/domain/domainobject/user-login-migration.do';
import { User } from '@shared/domain/entity/user.entity';
import { Permission } from '@shared/domain/interface/permission.enum';
import { Logger } from '@src/core/logger/logger';
import { AuthorizationContextBuilder } from '@src/modules/authorization/authorization-context.builder';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { AuthorizationContext } from '@src/modules/authorization/types/authorization-context.interface';
import { LegacySchoolService } from '@src/modules/legacy-school/service/legacy-school.service';
import { SchoolNumberMissingLoggableException } from '../error/school-number-missing.loggable-exception';
import { UserLoginMigrationAlreadyClosedLoggableException } from '../error/user-login-migration-already-closed.loggable-exception';
import { UserLoginMigrationStartLoggable } from '../loggable/user-login-migration-start.loggable';
import { UserLoginMigrationService } from '../service/user-login-migration.service';

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
