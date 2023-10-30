import { Injectable } from '@nestjs/common';
import { LegacySchoolDo } from '@shared/domain/domainobject/legacy-school.do';
import { UserLoginMigrationDO } from '@shared/domain/domainobject/user-login-migration.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { EntityId } from '@shared/domain/types/entity-id';
import { UserLoginMigrationRepo } from '@shared/repo/userloginmigration/user-login-migration.repo';
import { LegacySchoolService } from '@src/modules/legacy-school/service/legacy-school.service';
import { UserService } from '@src/modules/user/service/user.service';

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
