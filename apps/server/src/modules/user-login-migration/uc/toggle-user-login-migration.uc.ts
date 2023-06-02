import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { LegacyLogger } from '@src/core/logger';
import { UserLoginMigrationDO } from '@shared/domain';
import { UserLoginMigrationService } from '../service';
import { CommonUserLoginMigrationService } from '../service/common-user-login-migration.service';

@Injectable()
export class ToggleUserLoginMigrationUc {
	constructor(
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly commonUserLoginMigrationService: CommonUserLoginMigrationService,
		private readonly logger: LegacyLogger
	) {}

	async toggleMigration(userId: string, schoolId: string): Promise<UserLoginMigrationDO> {
		await this.checkPreconditions(userId, schoolId);

		const toggledMigration: UserLoginMigrationDO = await this.userLoginMigrationService.toggleMigration(schoolId);

		const toggled = toggledMigration.mandatorySince ? 'true' : 'false';

		this.logger.debug(`The school admin changed the user login migration toggle to: ${toggled}`);

		return toggledMigration;
	}

	private async checkPreconditions(userId: string, schoolId: string): Promise<void> {
		await this.commonUserLoginMigrationService.ensurePermission(userId, schoolId);

		const existingMigration: UserLoginMigrationDO | null =
			await this.commonUserLoginMigrationService.findExistingUserLoginMigration(schoolId);

		this.commonUserLoginMigrationService.hasNotFinishedMigrationOrThrow(existingMigration);
	}
}
