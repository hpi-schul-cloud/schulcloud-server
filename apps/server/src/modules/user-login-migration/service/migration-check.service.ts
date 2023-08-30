import { Injectable } from '@nestjs/common';
import { EntityId, UserLoginMigrationDO } from '@shared/domain';
import { LegacySchoolDo } from '@shared/domain/domainobject/school.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { UserLoginMigrationRepo } from '@shared/repo';
import { LegacySchoolService } from '@src/modules/school';
import { UserService } from '@src/modules/user';

@Injectable()
export class MigrationCheckService {
	constructor(
		private readonly userService: UserService,
		private readonly schoolService: LegacySchoolService,
		private readonly userLoginMigrationRepo: UserLoginMigrationRepo
	) {}

	async shouldUserMigrate(externalUserId: string, systemId: EntityId, officialSchoolNumber: string): Promise<boolean> {
		const school: LegacySchoolDo | null = await this.schoolService.getSchoolBySchoolNumber(officialSchoolNumber);

		if (school && school.id) {
			const userLoginMigration: UserLoginMigrationDO | null = await this.userLoginMigrationRepo.findBySchoolId(
				school.id
			);

			const user: UserDO | null = await this.userService.findByExternalId(externalUserId, systemId);

			if (user?.lastLoginSystemChange && userLoginMigration && !userLoginMigration.closedAt) {
				const hasMigrated: boolean = user.lastLoginSystemChange > userLoginMigration.startedAt;
				return !hasMigrated;
			}
			return !!userLoginMigration && !userLoginMigration.closedAt;
		}
		return false;
	}
}
