import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Permission, SchoolDO, UserLoginMigrationDO } from '@shared/domain';
import { Action, AuthorizationContext, AuthorizationService } from '@src/modules/authorization';
import { SchoolService } from '@src/modules/school';
import { UserLoginMigrationService } from './user-login-migration.service';
import { ModifyUserLoginMigrationError } from '../error';

@Injectable()
export class CommonUserLoginMigrationService {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly schoolService: SchoolService
	) {}

	async ensurePermission(userId: string, schoolId: string): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const school: SchoolDO = await this.schoolService.getSchoolById(schoolId);
		const context: AuthorizationContext = {
			action: Action.write,
			requiredPermissions: [Permission.USER_LOGIN_MIGRATION_ADMIN],
		};

		this.authorizationService.checkPermission(user, school, context);
	}

	async findExistingUserLoginMigration(schoolId: string): Promise<UserLoginMigrationDO | null> {
		const existingUserLoginMigration: UserLoginMigrationDO | null =
			await this.userLoginMigrationService.findMigrationBySchool(schoolId);

		return existingUserLoginMigration;
	}

	hasNotFinishedMigrationOrThrow(userLoginMigration: UserLoginMigrationDO | null): void {
		if (userLoginMigration?.finishedAt) {
			throw new ModifyUserLoginMigrationError(
				`The school with schoolId ${userLoginMigration.schoolId} already finished the migration.`
			);
		}
	}
}
