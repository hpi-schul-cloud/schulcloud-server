import { Injectable } from '@nestjs/common';
import { UserLoginMigrationDO } from '@shared/domain/domainobject/user-login-migration.do';
import { SchoolFeatures } from '@shared/domain/entity/school.entity';
import { LegacySchoolService } from '@src/modules/legacy-school/service/legacy-school.service';
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
