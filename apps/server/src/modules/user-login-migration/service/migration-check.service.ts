import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { UserService } from '@src/modules/user';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserMigrationService } from './user-migration.service';
import { SchoolMigrationService } from './school-migration.service';
import { SchoolService } from '../../school';

@Injectable()
export class MigrationCheckService {
	constructor(
		private readonly userService: UserService,
		private readonly userMigrationService: UserMigrationService,
		private readonly schoolMigrationService: SchoolMigrationService,
		private readonly schoolService: SchoolService
	) {}

	async getMigrationData(
		externalId: string,
		systemId: string,
		officialSchoolNumber?: string
	): Promise<string | undefined> {
		let redirect: string;
		let shouldMigrate = false;

		const existingUser: UserDO | null = await this.userService.findByExternalId(externalId, systemId);

		if (officialSchoolNumber) {
			if (!existingUser) {
				// we do not know anything about the user, so wie need to check the school
				const schouldNonExistingUserMigrate = await this.schoolMigrationService.isSchoolInMigration(
					officialSchoolNumber
				);

				shouldMigrate = schouldNonExistingUserMigrate;
			} else if (existingUser) {
				const shouldExistingUserMigrate: boolean = await this.shouldExistingUserMigrate(
					existingUser,
					officialSchoolNumber
				);

				shouldMigrate = shouldExistingUserMigrate;
			}
		}

		if (shouldMigrate && officialSchoolNumber) {
			redirect = await this.userMigrationService.getMigrationRedirect(systemId, officialSchoolNumber);
			return redirect;
		}
		return undefined;
	}

	private async shouldExistingUserMigrate(existingUser: UserDO, officialSchoolNumber: string): Promise<boolean> {
		let isSchoolInMigration: boolean;
		let shouldMigrate = false;

		const school: SchoolDO | null = await this.schoolService.getSchoolBySchoolNumber(officialSchoolNumber);

		if (school && school.officialSchoolNumber && school.oauthMigrationPossible) {
			isSchoolInMigration = await this.schoolMigrationService.isSchoolInMigration(school.officialSchoolNumber);

			if (existingUser.lastLoginSystemChange) {
				const hasMigrated = this.userHasMigrated(school.oauthMigrationPossible, existingUser.lastLoginSystemChange);
				shouldMigrate = !hasMigrated && isSchoolInMigration;
			} else {
				shouldMigrate = isSchoolInMigration;
			}
		}

		return shouldMigrate;
	}

	private userHasMigrated(migrationPossible: Date, lastLoginSystemChange: Date): boolean {
		if (migrationPossible < lastLoginSystemChange) {
			return true;
		}
		return false;
	}
}
