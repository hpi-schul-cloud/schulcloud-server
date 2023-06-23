import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { UserLoginMigrationDO } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { UserLoginMigrationService, StartUserLoginMigrationValidationService } from '../service';
import { UserLoginMigrationLoggable } from '../loggable/user-login-migration.loggable';

@Injectable()
export class StartUserLoginMigrationUc {
	constructor(
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly startUserLoginMigrationValidationService: StartUserLoginMigrationValidationService,
		private readonly logger: Logger
	) {
		this.logger.setContext(StartUserLoginMigrationUc.name);
	}

	async startMigration(userId: string, schoolId: string): Promise<UserLoginMigrationDO> {
		await this.startUserLoginMigrationValidationService.checkPreconditions(userId, schoolId);

		const userLoginMigrationDO: UserLoginMigrationDO = await this.userLoginMigrationService.startMigration(schoolId);
		this.logger.log(
			new UserLoginMigrationLoggable(`The school admin started the migration for the school with id:`, schoolId, userId)
		);

		return userLoginMigrationDO;
	}
}
