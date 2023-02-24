import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { UserService } from '@src/modules/user';
import { UserMigrationService } from './user-migration.service';
import { SchoolMigrationService } from './school-migration.service';
import { SchoolMigrationFlags } from './dto/school-migration-flags';

@Injectable()
export class MigrationCheckService {
	constructor(
		private readonly userService: UserService,
		private readonly userMigrationService: UserMigrationService,
		private readonly schoolMigrationService: SchoolMigrationService
	) {}

	async checkMigration(
		externalId: string,
		systemId: string,
		officialSchoolNumber?: string
	): Promise<string | undefined> {
		let redirect: string;
		if (officialSchoolNumber) {
			const shouldMigrate: boolean = await this.shouldUserMigrate(externalId, officialSchoolNumber, systemId);
			if (shouldMigrate) {
				redirect = await this.userMigrationService.getMigrationRedirect(officialSchoolNumber, systemId);
				return redirect;
			}
		}
		return undefined;
	}

	private async shouldUserMigrate(externalUserId: string, officialSchoolNumber: string, systemId: EntityId) {
		const existingUser: UserDO | null = await this.userService.findByExternalId(externalUserId, systemId);

		const isSchoolInMigration: SchoolMigrationFlags = await this.schoolMigrationService.isSchoolInMigration(
			officialSchoolNumber
		);

		const shouldMigrate = !existingUser && isSchoolInMigration;
		return shouldMigrate;
	}
}
