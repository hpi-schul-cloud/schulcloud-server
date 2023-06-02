import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { SchoolDO, UserLoginMigrationDO } from '@shared/domain';
import { SchoolService } from '@src/modules/school';
import { ModifyUserLoginMigrationError } from '../error';
import { CommonUserLoginMigrationService } from './common-user-login-migration.service';

@Injectable()
export class StartUserLoginMigrationValidationService {
	constructor(
		private readonly schoolService: SchoolService,
		private readonly commonUserLoginMigrationService: CommonUserLoginMigrationService
	) {}

	async checkPreconditions(userId: string, schoolId: string): Promise<void> {
		await this.commonUserLoginMigrationService.ensurePermission(userId, schoolId);

		await this.hasOfficialSchoolNumberOrThrow(schoolId);

		const existingUserLoginMigration: UserLoginMigrationDO | null =
			await this.commonUserLoginMigrationService.findExistingUserLoginMigration(schoolId);

		this.commonUserLoginMigrationService.hasNotFinishedMigrationOrThrow(existingUserLoginMigration);

		this.hasAlreadyStartedMigrationOrThrow(existingUserLoginMigration);
	}

	private async hasOfficialSchoolNumberOrThrow(schoolId: string): Promise<void> {
		const schoolDo: SchoolDO = await this.schoolService.getSchoolById(schoolId);

		if (!schoolDo.officialSchoolNumber) {
			throw new ModifyUserLoginMigrationError(`The school with schoolId ${schoolId} has no official school number.`);
		}
	}

	private hasAlreadyStartedMigrationOrThrow(userLoginMigration: UserLoginMigrationDO | null): void {
		if (userLoginMigration) {
			throw new ModifyUserLoginMigrationError(
				`The school with schoolId ${userLoginMigration.schoolId} already started the migration.`
			);
		}
	}
}
