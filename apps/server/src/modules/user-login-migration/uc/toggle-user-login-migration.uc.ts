import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { UserLoginMigrationDO } from '@shared/domain';
import { UserLoginMigrationService, CommonUserLoginMigrationService } from '../service';
import { UserLoginMigrationLoggable } from '../loggable/user-login-migration.loggable';

@Injectable()
export class ToggleUserLoginMigrationUc {
	constructor(
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly commonUserLoginMigrationService: CommonUserLoginMigrationService,
		private readonly logger: Logger
	) {}

	async toggleMigration(userId: string, schoolId: string): Promise<UserLoginMigrationDO> {
		await this.checkPreconditions(userId, schoolId);

		const toggledMigration: UserLoginMigrationDO = await this.userLoginMigrationService.toggleMigration(schoolId);

		const toggled = toggledMigration.mandatorySince ? 'true' : 'false';

		this.logger.debug(
			new UserLoginMigrationLoggable(`The school admin changed the user login migration toggle to: ${toggled}`)
		);

		return toggledMigration;
	}

	private async checkPreconditions(userId: string, schoolId: string): Promise<void> {
		await this.commonUserLoginMigrationService.ensurePermission(userId, schoolId);

		const existingMigration: UserLoginMigrationDO | null =
			await this.commonUserLoginMigrationService.findExistingUserLoginMigration(schoolId);

		this.commonUserLoginMigrationService.hasNotFinishedMigrationOrThrow(existingMigration);
	}
}
