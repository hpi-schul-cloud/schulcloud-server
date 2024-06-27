import { AuthorizationService } from '@modules/authorization';
import { LegacySchoolService } from '@modules/legacy-school';
import { UserImportService } from '@modules/user-import';
import { Injectable } from '@nestjs/common';
import { LegacySchoolDo } from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
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
		const school: LegacySchoolDo = await this.schoolService.getSchoolById(user.school.id);

		if (school.inUserMigration) {
			this.authorizationService.checkAllPermissions(user, [Permission.IMPORT_USER_MIGRATE]);

			await this.userImportService.resetMigrationForUsersSchool(user, school);
		}
	}
}
