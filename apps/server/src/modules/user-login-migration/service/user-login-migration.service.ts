import { Injectable } from '@nestjs/common';
import { EntityId, UserLoginMigrationDO } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { UserLoginMigrationRepo } from '@shared/repo/userloginmigration/user-login-migration.repo';
import { UserService } from '@src/modules/user';

@Injectable()
export class UserLoginMigrationService {
	constructor(
		private readonly userService: UserService,
		private readonly userLoginMigrationRepo: UserLoginMigrationRepo
	) {}

	async save(userLoginMigration: UserLoginMigrationDO): Promise<UserLoginMigrationDO> {
		const savedDO: UserLoginMigrationDO = await this.userLoginMigrationRepo.save(userLoginMigration);

		return savedDO;
	}

	async findById(userLoginMigrationId: EntityId): Promise<UserLoginMigrationDO> {
		const userLoginMigration: UserLoginMigrationDO = await this.userLoginMigrationRepo.findById(userLoginMigrationId);

		return userLoginMigration;
	}

	async findByUser(userId: EntityId): Promise<UserLoginMigrationDO | null> {
		const userDO: UserDO = await this.userService.findById(userId);
		const { schoolId } = userDO;

		const userLoginMigration: UserLoginMigrationDO | null = await this.userLoginMigrationRepo.findBySchoolId(schoolId);

		if (!userLoginMigration) {
			return null;
		}

		const hasUserMigrated: boolean =
			!!userDO.lastLoginSystemChange && userDO.lastLoginSystemChange > userLoginMigration.startedAt;

		if (hasUserMigrated) {
			return null;
		}

		return userLoginMigration;
	}
}
