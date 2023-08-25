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

	async revertUserLoginMigration(userLoginMigration: UserLoginMigrationDO): Promise<UserLoginMigrationDO> {
		await this.schoolService.removeFeature(userLoginMigration.schoolId, SchoolFeatures.OAUTH_PROVISIONING_ENABLED);
		await this.userLoginMigrationService.deleteUserLoginMigration(userLoginMigration);

		const revertedUserLoginMigration = new UserLoginMigrationDO({
			schoolId: userLoginMigration.schoolId,
			targetSystemId: userLoginMigration.targetSystemId,
			startedAt: undefined,
			finishedAt: undefined,
			mandatorySince: undefined,
			closedAt: undefined,
			sourceSystemId: undefined,
		});

		return revertedUserLoginMigration;
	}
}
