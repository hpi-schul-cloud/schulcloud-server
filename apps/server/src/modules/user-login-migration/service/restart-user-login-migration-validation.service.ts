import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { UserLoginMigrationDO } from '@shared/domain';
import { CommonUserLoginMigrationService } from './common-user-login-migration.service';
import { UserLoginMigrationLoggableException } from '../error';

@Injectable()
export class RestartUserLoginMigrationValidationService {
	constructor(private readonly commonUserLoginMigrationService: CommonUserLoginMigrationService) {}

	async checkPreconditions(userId: string, schoolId: string): Promise<void> {
		await this.commonUserLoginMigrationService.ensurePermission(userId, schoolId);

		const existingUserLoginMigration: UserLoginMigrationDO = await this.hasExistingUserLoginMigrationOrThrow(schoolId);

		this.validateGracePeriod(existingUserLoginMigration);

		this.isClosed(existingUserLoginMigration);
	}

	private isClosed(userLoginMigration: UserLoginMigrationDO): void {
		if (!userLoginMigration.closedAt) {
			throw new UserLoginMigrationLoggableException(
				`Migration for school with id ${userLoginMigration.schoolId} is already started, you are not able to restart.`,
				userLoginMigration.schoolId
			);
		}
	}

	private validateGracePeriod(userLoginMigration: UserLoginMigrationDO) {
		if (userLoginMigration.finishedAt && Date.now() >= userLoginMigration.finishedAt.getTime()) {
			throw new UserLoginMigrationLoggableException(
				'grace_period_expired: The grace period after finishing migration has expired',
				userLoginMigration.schoolId,
				userLoginMigration.finishedAt
			);
		}
	}

	private async hasExistingUserLoginMigrationOrThrow(schoolId: string): Promise<UserLoginMigrationDO> {
		const existingUserLoginMigration: UserLoginMigrationDO | null =
			await this.commonUserLoginMigrationService.findExistingUserLoginMigration(schoolId);

		if (existingUserLoginMigration === null) {
			throw new UserLoginMigrationLoggableException(
				`Existing migration for school with id: ${schoolId} could not be found for restart.`,
				schoolId
			);
		}
		return existingUserLoginMigration;
	}
}
