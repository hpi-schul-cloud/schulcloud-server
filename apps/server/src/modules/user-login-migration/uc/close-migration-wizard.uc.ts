import { AuthorizationService } from '@modules/authorization';
import { LegacySchoolService } from '@modules/legacy-school';
import { UserImportService } from '@modules/user-import';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';

@Injectable()
export class CloseMigrationWizardUc {
	constructor(
		private readonly schoolService: LegacySchoolService,
		private readonly userImportService: UserImportService,
		private readonly authorizationService: AuthorizationService
	) {}

	public async closeMigrationWizardWhenActive(userId: EntityId): Promise<void> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const school = await this.schoolService.getSchoolById(user.school.id);

		if (school.inUserMigration) {
			this.authorizationService.checkAllPermissions(user, [Permission.IMPORT_USER_MIGRATE]);

			await this.userImportService.resetMigrationForUsersSchool(user, school);
		}
	}
}
