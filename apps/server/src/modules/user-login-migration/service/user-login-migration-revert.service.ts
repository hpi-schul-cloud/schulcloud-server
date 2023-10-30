import { Injectable } from '@nestjs/common';
import { SchoolFeatures, UserLoginMigrationDO } from '@shared/domain';
import { LegacySchoolService } from '@src/modules/legacy-school';
import { UserLoginMigrationService } from './user-login-migration.service';

@Injectable()
export class UserLoginMigrationRevertService {
	constructor(
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly schoolService: LegacySchoolService
	) {}

	async revertUserLoginMigration(userLoginMigration: UserLoginMigrationDO): Promise<void> {
		await this.schoolService.removeFeature(userLoginMigration.schoolId, SchoolFeatures.OAUTH_PROVISIONING_ENABLED);
		await this.userLoginMigrationService.deleteUserLoginMigration(userLoginMigration);
	}
}
