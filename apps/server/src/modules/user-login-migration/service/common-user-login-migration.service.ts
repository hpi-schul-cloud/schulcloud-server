import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Permission, UserLoginMigrationDO } from '@shared/domain';
import { Action, AllowedAuthorizationEntityType, AuthorizationService } from '@src/modules/authorization';
import { UserLoginMigrationService } from './user-login-migration.service';

@Injectable()
export class CommonUserLoginMigrationService {
	constructor(
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

	async findExistingUserLoginMigration(schoolId: string): Promise<UserLoginMigrationDO | null> {
		const existingUserLoginMigration: UserLoginMigrationDO | null =
			await this.userLoginMigrationService.findMigrationBySchool(schoolId);

		return existingUserLoginMigration;
	}
}
