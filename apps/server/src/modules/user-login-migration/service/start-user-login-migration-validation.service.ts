import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { SchoolDO, UserLoginMigrationDO } from '@shared/domain';
import { SchoolService } from '@src/modules/school';
import { AuthorizationService } from '@src/modules/authorization';
import { StartUserLoginMigrationError } from '../error';
import { UserLoginMigrationService } from './user-login-migration.service';
import { CommonUserLoginMigrationService } from './common-user-login-migration.service';

@Injectable()
export class StartUserLoginMigrationValidationService {
	constructor(
		private readonly schoolService: SchoolService,
		private readonly authorizationService: AuthorizationService,
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly commonUserLoginMigrationService: CommonUserLoginMigrationService
	) {}

	async checkPreconditions(userId: string, schoolId: string) {
		await this.commonUserLoginMigrationService.ensurePermission(userId, schoolId);

		await this.hasOfficialSchoolNumber(schoolId);

		const existingUserLoginMigration: UserLoginMigrationDO | null =
			await this.commonUserLoginMigrationService.findExistingUserLoginMigration(schoolId);

		this.commonUserLoginMigrationService.hasFinishedMigration(existingUserLoginMigration);

		this.hasAlreadyStartedMigration(existingUserLoginMigration);
	}

	private async hasOfficialSchoolNumber(schoolId: string): Promise<void> {
		const schoolDo: SchoolDO = await this.schoolService.getSchoolById(schoolId);

		if (!schoolDo.officialSchoolNumber) {
			throw new StartUserLoginMigrationError(`The school with schoolId ${schoolId} has no official school number.`);
		}
	}

	private hasAlreadyStartedMigration(userLoginMigration: UserLoginMigrationDO | null): void {
		if (userLoginMigration) {
			throw new StartUserLoginMigrationError(
				`The school with schoolId ${userLoginMigration.schoolId} already started the migration.`
			);
		}
	}
}
