import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Permission, SchoolDO, UserLoginMigrationDO } from '@shared/domain';
import { SchoolService } from '@src/modules/school';
import { Action, AuthorizationContext, AuthorizationService } from '@src/modules/authorization';
import { StartUserLoginMigrationError } from '../error';
import { UserLoginMigrationService } from './user-login-migration.service';

@Injectable()
export class StartUserLoginMigrationCheckService {
	constructor(
		private readonly schoolService: SchoolService,
		private readonly authorizationService: AuthorizationService,
		private readonly userLoginMigrationService: UserLoginMigrationService
	) {}

	async checkPreconditions(userId: string, schoolId: string) {
		await this.ensurePermission(userId, schoolId);

		await this.hasOfficialSchoolNumber(schoolId);

		const existingUserLoginMigration: UserLoginMigrationDO | null =
			await this.userLoginMigrationService.findMigrationBySchool(schoolId);

		this.hasFinishedMigration(existingUserLoginMigration);

		this.hasAlreadyStartedMigration(existingUserLoginMigration);
	}

	private async ensurePermission(userId: string, schoolId: string): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const school: SchoolDO = await this.schoolService.getSchoolById(schoolId);
		const context: AuthorizationContext = {
			action: Action.write,
			requiredPermissions: [Permission.USER_LOGIN_MIGRATION_ADMIN],
		};

		this.authorizationService.checkPermission(user, school, context);
	}

	private async hasOfficialSchoolNumber(schoolId: string): Promise<void> {
		const schoolDo: SchoolDO = await this.schoolService.getSchoolById(schoolId);

		if (!schoolDo.officialSchoolNumber) {
			throw new StartUserLoginMigrationError(`The school with schoolId ${schoolId} has no official school number.`);
		}
	}

	private hasFinishedMigration(userLoginMigration: UserLoginMigrationDO | null) {
		if (userLoginMigration?.finishedAt) {
			throw new StartUserLoginMigrationError(
				`The school with schoolId ${userLoginMigration.schoolId} already finished the migration.`
			);
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
