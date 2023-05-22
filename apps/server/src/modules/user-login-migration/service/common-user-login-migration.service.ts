import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Permission, UserLoginMigrationDO } from '@shared/domain';
import { Action, AllowedAuthorizationEntityType, AuthorizationService } from '@src/modules/authorization';
import { SchoolService } from '@src/modules/school';
import { UserLoginMigrationService } from './user-login-migration.service';
import { StartUserLoginMigrationError } from '../error';

@Injectable()
export class CommonUserLoginMigrationService {
	constructor(
		private readonly schoolService: SchoolService,
		private readonly authorizationService: AuthorizationService,
		private readonly userLoginMigrationService: UserLoginMigrationService
	) {}

	async ensurePermission(userId: string, schoolId: string): Promise<void> {
		await this.authorizationService.checkPermissionByReferences(
			userId,
			AllowedAuthorizationEntityType.School,
			schoolId,
			{
				action: Action.write,
				requiredPermissions: [Permission.USER_LOGIN_MIGRATION_ADMIN],
			}
		);
	}

	hasFinishedMigration(userLoginMigration: UserLoginMigrationDO | null) {
		if (userLoginMigration?.finishedAt) {
			throw new StartUserLoginMigrationError(
				`The school with schoolId ${userLoginMigration.schoolId} already finished the migration.`
			);
		}
	}

	async findExistingUserLoginMigration(schoolId: string): Promise<UserLoginMigrationDO | null> {
		const existingUserLoginMigration: UserLoginMigrationDO | null =
			await this.userLoginMigrationService.findMigrationBySchool(schoolId);

		return existingUserLoginMigration;
	}
}
