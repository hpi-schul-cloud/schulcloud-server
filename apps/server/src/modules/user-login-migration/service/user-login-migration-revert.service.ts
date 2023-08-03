import { Injectable } from '@nestjs/common';
import { SchoolFeatures, UserLoginMigrationDO } from '@shared/domain';
import { SchoolService } from '@src/modules/school';
import { UserLoginMigrationService } from './user-login-migration.service';

@Injectable()
export class UserLoginMigrationRevertService {
	constructor(
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly schoolService: SchoolService
	) {}

	async revertUserLoginMigration(userLoginMigration: UserLoginMigrationDO): Promise<void> {
		await this.schoolService.removeFeature(userLoginMigration.schoolId, SchoolFeatures.OAUTH_PROVISIONING_ENABLED);
		await this.userLoginMigrationService.deleteUserLoginMigration(userLoginMigration);
	}
}
