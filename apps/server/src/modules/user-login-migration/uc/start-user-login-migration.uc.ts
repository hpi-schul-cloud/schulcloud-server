import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { UserLoginMigrationDO } from '@shared/domain';
import { LegacyLogger } from '@src/core/logger';
import { UserLoginMigrationService } from '../service';
import { StartUserLoginMigrationCheckService } from '../service/start-user-login-migration-check.service';

@Injectable()
export class StartUserLoginMigrationUc {
	constructor(
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly startUserLoginMigrationCheckService: StartUserLoginMigrationCheckService,
		private readonly logger: LegacyLogger
	) {}

	async startMigration(userId: string, schoolId: string): Promise<UserLoginMigrationDO> {
		await this.startUserLoginMigrationCheckService.checkPreconditions(userId, schoolId);

		const userLoginMigrationDO: UserLoginMigrationDO = await this.userLoginMigrationService.startMigration(schoolId);
		this.logger.debug(`The school admin started the migration for the school with id: ${schoolId}`);

		return userLoginMigrationDO;
	}
}
