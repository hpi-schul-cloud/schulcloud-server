import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { LegacyLogger } from '@src/core/logger';
import { UserLoginMigrationDO } from '@shared/domain';
import { UserLoginMigrationService, RestartUserLoginMigrationValidationService } from '../service';

@Injectable()
export class RestartUserLoginMigrationUc {
	constructor(
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly restartUserLoginMigrationValidationService: RestartUserLoginMigrationValidationService,
		private readonly logger: LegacyLogger
	) {}

	async restartMigration(userId: string, schoolId: string): Promise<UserLoginMigrationDO> {
		await this.restartUserLoginMigrationValidationService.checkPreconditions(userId, schoolId);

		const userLoginMigrationDO: UserLoginMigrationDO = await this.userLoginMigrationService.restartMigration(schoolId);
		this.logger.debug(`The school admin started the migration for the school with id: ${schoolId}`);

		return userLoginMigrationDO;
	}
}
