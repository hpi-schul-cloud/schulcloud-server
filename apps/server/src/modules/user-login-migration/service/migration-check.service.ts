import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { UserService } from '@src/modules/user';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserMigrationService } from './user-migration.service';
import { SchoolMigrationService } from './school-migration.service';
import { SchoolMigrationFlags } from './dto/school-migration-flags';
import { SchoolService } from '../../school';

@Injectable()
export class MigrationCheckService {
	constructor(
		private readonly userService: UserService,
		private readonly userMigrationService: UserMigrationService,
		private readonly schoolMigrationService: SchoolMigrationService,

		private readonly schoolService: SchoolService
	) {}

	async checkMigration(
		externalId: string,
		systemId: string,
		officialSchoolNumber?: string
	): Promise<string | undefined> {
		let redirect: string;
		const shouldMigrate: boolean = await this.shouldUserMigrate(externalId, systemId, officialSchoolNumber);
		if (shouldMigrate) {
			redirect = await this.userMigrationService.getMigrationRedirect(systemId, officialSchoolNumber);
			return redirect;
		}
		return undefined;
	}

	private async shouldUserMigrate(
		externalUserId: string,
		systemId: EntityId,
		officialSchoolNumber?: string
	): Promise<boolean> {
		let isSchoolInMigration: boolean;
		let shouldMigrate = false;
		let hasMigrated = false;

		const existingUser: UserDO | null = await this.userService.findByExternalId(externalUserId, systemId);

		if (existingUser) {
			const school: SchoolDO = await this.schoolService.getSchoolById(existingUser.schoolId);

			if (school.officialSchoolNumber && school.oauthMigrationPossible && existingUser.lastLoginSystemChange) {
				isSchoolInMigration = await this.schoolMigrationService.isSchoolInMigration(school.officialSchoolNumber);
				hasMigrated = this.compareMigrationDates(school.oauthMigrationPossible, existingUser.lastLoginSystemChange);

				shouldMigrate = !hasMigrated && isSchoolInMigration;
			}
		} else if (officialSchoolNumber) {
			isSchoolInMigration = await this.schoolMigrationService.isSchoolInMigration(officialSchoolNumber);

			shouldMigrate = isSchoolInMigration;
		}

		return shouldMigrate;
	}

	private compareMigrationDates(migrationPossible: Date, lastLoginSystemChange: Date): boolean {
		if (migrationPossible < lastLoginSystemChange) {
			return true;
		}
		return false;
	}
}
