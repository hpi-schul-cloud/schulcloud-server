import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Permission, SchoolDO, User, UserLoginMigrationDO } from '@shared/domain';
import { AuthorizationContext, AuthorizationContextBuilder, AuthorizationService } from '@src/modules/authorization';
import { SchoolService } from '@src/modules/school';
import { UserLoginMigrationService } from './user-login-migration.service';
import { ModifyUserLoginMigrationLoggableException } from '../error';

@Injectable()
export class CommonUserLoginMigrationService {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly schoolService: SchoolService
	) {}

	async ensurePermission(userId: string, schoolId: string): Promise<void> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const school: SchoolDO = await this.schoolService.getSchoolById(schoolId);
		const context: AuthorizationContext = AuthorizationContextBuilder.write([Permission.USER_LOGIN_MIGRATION_ADMIN]);

		this.authorizationService.checkPermission(user, school, context);
	}

	async findExistingUserLoginMigration(schoolId: string): Promise<UserLoginMigrationDO | null> {
		const existingUserLoginMigration: UserLoginMigrationDO | null =
			await this.userLoginMigrationService.findMigrationBySchool(schoolId);

		return existingUserLoginMigration;
	}

	hasNotFinishedMigrationOrThrow(userLoginMigration: UserLoginMigrationDO | null): void {
		if (userLoginMigration?.finishedAt) {
			throw new ModifyUserLoginMigrationLoggableException(
				`The school with schoolId ${userLoginMigration.schoolId} already finished the migration.`,
				userLoginMigration.schoolId,
				userLoginMigration.finishedAt
			);
		}
	}
}
