import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { LegacySchoolService } from '@modules/legacy-school';
import { UserImportService } from '@modules/user-import';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { LegacySchoolDo, UserLoginMigrationDO } from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { UserLoginMigrationNotFoundLoggableException } from '../loggable';
import { SchoolMigrationService, UserLoginMigrationRevertService, UserLoginMigrationService } from '../service';

@Injectable()
export class CloseUserLoginMigrationUc {
	constructor(
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly schoolMigrationService: SchoolMigrationService,
		private readonly userLoginMigrationRevertService: UserLoginMigrationRevertService,
		private readonly authorizationService: AuthorizationService,
		private readonly userImportService: UserImportService,
		private readonly schoolService: LegacySchoolService
	) {}

	public async closeMigration(userId: EntityId, schoolId: EntityId): Promise<UserLoginMigrationDO | undefined> {
		const userLoginMigration: UserLoginMigrationDO | null = await this.userLoginMigrationService.findMigrationBySchool(
			schoolId
		);

		if (!userLoginMigration) {
			throw new UserLoginMigrationNotFoundLoggableException(schoolId);
		}

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(
			user,
			userLoginMigration,
			AuthorizationContextBuilder.write([Permission.USER_LOGIN_MIGRATION_ADMIN])
		);

		await this.cleanupMigrationWizardWhenActive(user);

		const updatedUserLoginMigration: UserLoginMigrationDO = await this.userLoginMigrationService.closeMigration(
			userLoginMigration
		);

		const hasSchoolMigratedUser: boolean = await this.schoolMigrationService.hasSchoolMigratedUser(schoolId);

		if (!hasSchoolMigratedUser) {
			await this.userLoginMigrationRevertService.revertUserLoginMigration(updatedUserLoginMigration);

			return undefined;
		}

		await this.schoolMigrationService.markUnmigratedUsersAsOutdated(updatedUserLoginMigration);

		return updatedUserLoginMigration;
	}

	private async cleanupMigrationWizardWhenActive(user: User): Promise<void> {
		const school: LegacySchoolDo = await this.schoolService.getSchoolById(user.school.id);

		if (school.inUserMigration) {
			this.authorizationService.checkAllPermissions(user, [Permission.IMPORT_USER_MIGRATE]);

			await this.userImportService.resetMigrationForUsersSchool(user, school);
		}
	}
}
