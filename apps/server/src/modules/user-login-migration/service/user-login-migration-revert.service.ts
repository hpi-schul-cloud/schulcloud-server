import { Injectable } from '@nestjs/common';
import { UserLoginMigrationDO } from '@shared/domain';
import { SchoolMigrationService } from './school-migration.service';
import { UserLoginMigrationService } from './user-login-migration.service';

@Injectable()
export class UserLoginMigrationRevertService {
	constructor(
		private readonly schoolMigrationService: SchoolMigrationService,
		private readonly userLoginMigrationService: UserLoginMigrationService
	) {}

	async revertUserLoginMigration(userLoginMigration: UserLoginMigrationDO): Promise<void> {
		await this.schoolMigrationService.revertMigration(userLoginMigration.schoolId, userLoginMigration.targetSystemId);
		await this.userLoginMigrationService.deleteUserLoginMigration(userLoginMigration);
	}
}
