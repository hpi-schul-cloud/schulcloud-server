import { Injectable } from '@nestjs/common';
import { EntityId, UserLoginMigrationDO } from '@shared/domain';
import { LegacyLogger } from '@src/core/logger';
import { SchoolMigrationService } from './school-migration.service';
import { UserLoginMigrationService } from './user-login-migration.service';
import { RollbackUserLoginMigrationError } from '../error/rollback-user-login-migration.error';

@Injectable()
export class UserLoginMigrationRollbackService {
	constructor(
		private readonly schoolMigrationService: SchoolMigrationService,
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly logger: LegacyLogger
	) {}

	// TODO: 839 rename this service to an uc and fix usages.
	async rollbackIfNecessary(schoolId: EntityId): Promise<void> {
		const hasSchoolMigratedUser = await this.schoolMigrationService.hasSchoolMigratedUser(schoolId);

		if (!hasSchoolMigratedUser) {
			const userLoginMigration: UserLoginMigrationDO = await this.getUserLoginMigrationOrThrow(schoolId);

			if (userLoginMigration) {
				await this.rollbackMigration(schoolId, userLoginMigration);
			}
		} else {
			this.logger.log(`School (${schoolId}) has migrated user. School migration will not be rolled back.`);
		}
	}

	private async getUserLoginMigrationOrThrow(schoolId: EntityId): Promise<UserLoginMigrationDO> {
		const userLoginMigration: UserLoginMigrationDO | null = await this.userLoginMigrationService.findMigrationBySchool(
			schoolId
		);

		if (!userLoginMigration) {
			throw new RollbackUserLoginMigrationError(`The migration of school (${schoolId}) could not rolled back.`);
		}

		return userLoginMigration;
	}

	private async rollbackMigration(schoolId: EntityId, userLoginMigration: UserLoginMigrationDO): Promise<void> {
		await this.schoolMigrationService.rollbackMigration(schoolId, userLoginMigration.targetSystemId);
		await this.userLoginMigrationService.deleteUserLoginMigration(userLoginMigration);
	}
}
