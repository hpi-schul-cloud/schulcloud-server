import { LegacySchoolService } from '@modules/legacy-school';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { EntityId, LegacySchoolDo, UserDO, UserLoginMigrationDO } from '@shared/domain';
import { UserLoginMigrationRepo } from '@shared/repo';

@Injectable()
export class MigrationCheckService {
	constructor(
		private readonly userService: UserService,
		private readonly schoolService: LegacySchoolService,
		private readonly userLoginMigrationRepo: UserLoginMigrationRepo
	) {}

	public async shouldUserMigrate(
		externalUserId: string,
		systemId: EntityId,
		officialSchoolNumber: string
	): Promise<boolean> {
		const school: LegacySchoolDo | null = await this.schoolService.getSchoolBySchoolNumber(officialSchoolNumber);
		const userLoginMigration: UserLoginMigrationDO | null =
			school && school.id ? await this.userLoginMigrationRepo.findBySchoolId(school.id) : null;

		if (!school || !userLoginMigration) {
			return false;
		}

		const user: UserDO | null = await this.userService.findByExternalId(externalUserId, systemId);

		if (this.isMigrationDataValid(user, userLoginMigration)) {
			return !this.isUserMigrated(user, userLoginMigration);
		}

		return this.isMigrationActive(userLoginMigration);
	}

	private isMigrationDataValid(user: UserDO | null, userLoginMigration: UserLoginMigrationDO): boolean {
		return !!user?.lastLoginSystemChange && !userLoginMigration.closedAt;
	}

	private isUserMigrated(user: UserDO | null, userLoginMigration: UserLoginMigrationDO): boolean {
		return (
			!!user && user.lastLoginSystemChange !== undefined && user.lastLoginSystemChange > userLoginMigration.startedAt
		);
	}

	private isMigrationActive(userLoginMigration: UserLoginMigrationDO): boolean {
		return !userLoginMigration.closedAt;
	}
}
