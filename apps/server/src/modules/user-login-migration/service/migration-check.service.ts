import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { SchoolService } from '@src/modules/school';
import { UserService } from '@src/modules/user';

@Injectable()
export class MigrationCheckService {
	constructor(private readonly userService: UserService, private readonly schoolService: SchoolService) {}

	async shouldUserMigrate(externalUserId: string, systemId: EntityId, officialSchoolNumber: string): Promise<boolean> {
		const school: SchoolDO | null = await this.schoolService.getSchoolBySchoolNumber(officialSchoolNumber);

		if (school) {
			const user: UserDO | null = await this.userService.findByExternalId(externalUserId, systemId);

			if (user && user.lastLoginSystemChange && school.oauthMigrationPossible) {
				const hasMigrated: boolean = user.lastLoginSystemChange > school.oauthMigrationPossible;
				return !hasMigrated;
			}
			return !!school.oauthMigrationPossible;
		}
		return false;
	}
}
