import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { SchoolService } from '@src/modules/school';
import { AuthorizationService } from '@src/modules/authorization';
import { UserLoginMigrationDO } from '@shared/domain';
import { UserLoginMigrationService } from './user-login-migration.service';
import { CommonUserLoginMigrationService } from './common-user-login-migration.service';
import { RestartUserLoginMigrationError } from '../error';

@Injectable()
export class RestartUserLoginMigrationValidationService {
	constructor(
		private readonly schoolService: SchoolService,
		private readonly authorizationService: AuthorizationService,
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly commonUserLoginMigrationService: CommonUserLoginMigrationService
	) {}

	async checkPreconditions(userId: string, schoolId: string): Promise<void> {
		await this.commonUserLoginMigrationService.ensurePermission(userId, schoolId);

		const existingUserLoginMigration: UserLoginMigrationDO | null =
			await this.commonUserLoginMigrationService.findExistingUserLoginMigration(schoolId);

		if (existingUserLoginMigration === null) {
			throw new RestartUserLoginMigrationError('Existing migration could not be found for restart.');
		}

		this.commonUserLoginMigrationService.hasFinishedMigration(existingUserLoginMigration);

		this.isClosed(existingUserLoginMigration);
	}

	private isClosed(userLoginMigration: UserLoginMigrationDO): void {
		if (!userLoginMigration.closedAt) {
			throw new RestartUserLoginMigrationError('Migration is already started, you are not able to restart.');
		}
	}
}
