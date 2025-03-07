import { LegacySchoolService } from '@modules/legacy-school';
import { UserService } from '@modules/user';
import { UserDo } from '@modules/user/domain';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { UserLoginMigrationDO } from '../domain';
import { UserLoginMigrationRepo } from '../repo';

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
		const school = await this.schoolService.getSchoolBySchoolNumber(officialSchoolNumber);

		if (!school?.id) {
			return false;
		}

		const userLoginMigration = await this.userLoginMigrationRepo.findBySchoolId(school.id);

		if (!userLoginMigration || !this.isMigrationActive(userLoginMigration)) {
			return false;
		}

		const user = await this.userService.findByExternalId(externalUserId, systemId);

		if (this.isUserMigrated(user, userLoginMigration)) {
			return false;
		}

		return true;
	}

	private isUserMigrated(user: UserDo | null, userLoginMigration: UserLoginMigrationDO): boolean {
		return (
			!!user && user.lastLoginSystemChange !== undefined && user.lastLoginSystemChange > userLoginMigration.startedAt
		);
	}

	private isMigrationActive(userLoginMigration: UserLoginMigrationDO): boolean {
		return !userLoginMigration.closedAt;
	}
}
