import { Injectable } from '@nestjs/common';
import { LegacySchoolDo } from '@shared/domain/domainobject/legacy-school.do';
import { UserLoginMigrationDO } from '@shared/domain/domainobject/user-login-migration.do';
import { User } from '@shared/domain/entity/user.entity';
import { Permission } from '@shared/domain/interface/permission.enum';
import { Logger } from '@src/core/logger/logger';
import { AuthorizationContextBuilder } from '@src/modules/authorization/authorization-context.builder';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { AuthorizationContext } from '@src/modules/authorization/types/authorization-context.interface';
import { LegacySchoolService } from '@src/modules/legacy-school/service/legacy-school.service';
import { UserLoginMigrationAlreadyClosedLoggableException } from '../error/user-login-migration-already-closed.loggable-exception';
import { UserLoginMigrationGracePeriodExpiredLoggableException } from '../error/user-login-migration-grace-period-expired-loggable.exception';
import { UserLoginMigrationNotFoundLoggableException } from '../error/user-login-migration-not-found.loggable-exception';
import { UserLoginMigrationMandatoryLoggable } from '../loggable/user-login-migration-mandatory.loggable';
import { UserLoginMigrationService } from '../service/user-login-migration.service';

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
