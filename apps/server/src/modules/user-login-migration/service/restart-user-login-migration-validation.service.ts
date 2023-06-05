import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { UserLoginMigrationDO } from '@shared/domain';
import { CommonUserLoginMigrationService } from './common-user-login-migration.service';
import { ModifyUserLoginMigrationError } from '../error';

@Injectable()
export class RestartUserLoginMigrationValidationService {
	constructor(private readonly commonUserLoginMigrationService: CommonUserLoginMigrationService) {}

	async checkPreconditions(userId: string, schoolId: string): Promise<void> {
		await this.commonUserLoginMigrationService.ensurePermission(userId, schoolId);

		const existingUserLoginMigration: UserLoginMigrationDO | null =
			await this.commonUserLoginMigrationService.findExistingUserLoginMigration(schoolId);

		if (existingUserLoginMigration === null) {
			throw new ModifyUserLoginMigrationError(`Existing migration for school with id: ${schoolId} could not be found.`);
		}

		this.validateGracePeriod(existingUserLoginMigration);

		this.isClosed(existingUserLoginMigration);
	}

	private isClosed(userLoginMigration: UserLoginMigrationDO): void {
		if (!userLoginMigration.closedAt) {
			throw new ModifyUserLoginMigrationError(
				`Migration for school with id ${userLoginMigration.schoolId} is already started, you are not able to restart.`
			);
		}
	}

	private validateGracePeriod(userLoginMigration: UserLoginMigrationDO) {
		if (userLoginMigration.finishedAt && Date.now() >= userLoginMigration.finishedAt.getTime()) {
			throw new ModifyUserLoginMigrationError(
				'grace_period_expired: The grace period after finishing migration has expired',
				{
					finishedAt: userLoginMigration.finishedAt,
				}
			);
		}
	}
}
