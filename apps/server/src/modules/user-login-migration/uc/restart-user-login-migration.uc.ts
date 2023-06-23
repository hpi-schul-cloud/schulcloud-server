import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Logger } from '@src/core/logger';
import { UserLoginMigrationDO } from '@shared/domain';
import { UserLoginMigrationService, RestartUserLoginMigrationValidationService } from '../service';
import { UserLoginMigrationLoggable } from '../loggable/user-login-migration.loggable';

@Injectable()
export class RestartUserLoginMigrationUc {
	constructor(
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly restartUserLoginMigrationValidationService: RestartUserLoginMigrationValidationService,
		private readonly logger: Logger
	) {
		this.logger.setContext(RestartUserLoginMigrationUc.name);
	}

	async restartMigration(userId: string, schoolId: string): Promise<UserLoginMigrationDO> {
		await this.restartUserLoginMigrationValidationService.checkPreconditions(userId, schoolId);

		const userLoginMigrationDO: UserLoginMigrationDO = await this.userLoginMigrationService.restartMigration(schoolId);
		this.logger.log(
			new UserLoginMigrationLoggable(`The school admin started the migration for the school with id:`, schoolId, userId)
		);

		return userLoginMigrationDO;
	}
}
