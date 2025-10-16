import { LegacySchoolService } from '@modules/legacy-school';
import { SchoolFeature } from '@modules/school/domain';
import { Injectable } from '@nestjs/common';
import { UserLoginMigrationService } from './user-login-migration.service';
import { UserLoginMigrationDO } from '../do';

@Injectable()
export class UserLoginMigrationRevertService {
	constructor(
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly schoolService: LegacySchoolService
	) {}

	async revertUserLoginMigration(userLoginMigration: UserLoginMigrationDO): Promise<void> {
		await this.schoolService.removeFeature(userLoginMigration.schoolId, SchoolFeature.OAUTH_PROVISIONING_ENABLED);
		await this.userLoginMigrationService.deleteUserLoginMigration(userLoginMigration);
	}
}
