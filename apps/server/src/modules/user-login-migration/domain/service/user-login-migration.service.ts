import { LegacySchoolService } from '@modules/legacy-school';
import { LegacySchoolDo } from '@modules/legacy-school/domain';
import { SchoolFeature } from '@modules/school/domain';
import { System, SystemService } from '@modules/system';
import { SystemType } from '@modules/system/domain';
import { UserService } from '@modules/user';
import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { UserLoginMigrationRepo } from '../../repo';
import {
	USER_LOGIN_MIGRATION_PUBLIC_API_CONFIG_TOKEN,
	UserLoginMigrationPublicApiConfig,
} from '../../user-login-migration.config';
import { UserLoginMigrationDO } from '../do';
import {
	IdenticalUserLoginMigrationSystemLoggableException,
	MoinSchuleSystemNotFoundLoggableException,
	UserLoginMigrationAlreadyClosedLoggableException,
	UserLoginMigrationGracePeriodExpiredLoggableException,
} from '../loggable';

@Injectable()
export class UserLoginMigrationService {
	constructor(
		private readonly userService: UserService,
		private readonly userLoginMigrationRepo: UserLoginMigrationRepo,
		private readonly schoolService: LegacySchoolService,
		private readonly systemService: SystemService,
		@Inject(USER_LOGIN_MIGRATION_PUBLIC_API_CONFIG_TOKEN)
		private readonly config: UserLoginMigrationPublicApiConfig
	) {}

	public async startMigration(schoolId: string): Promise<UserLoginMigrationDO> {
		const schoolDo = await this.schoolService.getSchoolById(schoolId);

		const userLoginMigrationDO = await this.createNewMigration(schoolDo);

		this.enableOauthMigrationFeature(schoolDo);
		await this.schoolService.save(schoolDo);

		const userLoginMigration = await this.userLoginMigrationRepo.save(userLoginMigrationDO);

		return userLoginMigration;
	}

	public async restartMigration(userLoginMigration: UserLoginMigrationDO): Promise<UserLoginMigrationDO> {
		this.checkGracePeriod(userLoginMigration);

		if (!userLoginMigration.closedAt || !userLoginMigration.finishedAt) {
			return userLoginMigration;
		}

		userLoginMigration.closedAt = undefined;
		userLoginMigration.finishedAt = undefined;

		const updatedUserLoginMigration = await this.userLoginMigrationRepo.save(userLoginMigration);

		return updatedUserLoginMigration;
	}

	public async setMigrationMandatory(
		userLoginMigration: UserLoginMigrationDO,
		mandatory: boolean
	): Promise<UserLoginMigrationDO> {
		this.checkGracePeriod(userLoginMigration);

		if (userLoginMigration.closedAt) {
			throw new UserLoginMigrationAlreadyClosedLoggableException(userLoginMigration.closedAt, userLoginMigration.id);
		}

		if (mandatory) {
			userLoginMigration.mandatorySince = userLoginMigration.mandatorySince ?? new Date();
		} else {
			userLoginMigration.mandatorySince = undefined;
		}

		userLoginMigration = await this.userLoginMigrationRepo.save(userLoginMigration);

		return userLoginMigration;
	}

	public async closeMigration(userLoginMigration: UserLoginMigrationDO): Promise<UserLoginMigrationDO> {
		this.checkGracePeriod(userLoginMigration);

		if (userLoginMigration.closedAt) {
			return userLoginMigration;
		}

		await this.schoolService.removeFeature(
			userLoginMigration.schoolId,
			SchoolFeature.ENABLE_LDAP_SYNC_DURING_MIGRATION
		);

		const now = new Date();
		const gracePeriodDuration: number = this.config.migrationEndGracePeriodMs;

		userLoginMigration.closedAt = now;
		userLoginMigration.finishedAt = new Date(now.getTime() + gracePeriodDuration);

		userLoginMigration = await this.userLoginMigrationRepo.save(userLoginMigration);

		return userLoginMigration;
	}

	private checkGracePeriod(userLoginMigration: UserLoginMigrationDO) {
		if (userLoginMigration.finishedAt && this.isGracePeriodExpired(userLoginMigration)) {
			throw new UserLoginMigrationGracePeriodExpiredLoggableException(
				userLoginMigration.id as string,
				userLoginMigration.finishedAt
			);
		}
	}

	private isGracePeriodExpired(userLoginMigration: UserLoginMigrationDO): boolean {
		const isGracePeriodExpired =
			!!userLoginMigration.finishedAt && Date.now() >= userLoginMigration.finishedAt.getTime();

		return isGracePeriodExpired;
	}

	private async createNewMigration(school: LegacySchoolDo): Promise<UserLoginMigrationDO> {
		const oauthSystems = await this.systemService.find({ types: [SystemType.OAUTH] });
		const moinSchuleSystem = oauthSystems.find((system: System) => system.alias === 'moin.schule');

		if (!moinSchuleSystem) {
			throw new MoinSchuleSystemNotFoundLoggableException();
		} else if (school.systems?.includes(moinSchuleSystem.id)) {
			throw new IdenticalUserLoginMigrationSystemLoggableException(school.id, moinSchuleSystem.id);
		}

		const userLoginMigrationDO = new UserLoginMigrationDO({
			schoolId: school.id as string,
			targetSystemId: moinSchuleSystem.id,
			sourceSystemId: school.systems?.[0],
			startedAt: new Date(),
		});

		return userLoginMigrationDO;
	}

	// dangour this modified directly the object it self
	private enableOauthMigrationFeature(schoolDo: LegacySchoolDo): void {
		if (schoolDo.features && !schoolDo.features.includes(SchoolFeature.OAUTH_PROVISIONING_ENABLED)) {
			schoolDo.features.push(SchoolFeature.OAUTH_PROVISIONING_ENABLED);
		} else {
			schoolDo.features = [SchoolFeature.OAUTH_PROVISIONING_ENABLED];
		}
	}

	public async findMigrationBySchool(schoolId: string): Promise<UserLoginMigrationDO | null> {
		const userLoginMigration = await this.userLoginMigrationRepo.findBySchoolId(schoolId);

		return userLoginMigration;
	}

	public async findMigrationByUser(userId: EntityId): Promise<UserLoginMigrationDO | null> {
		const userDO = await this.userService.findById(userId);
		const { schoolId } = userDO;

		const userLoginMigration = await this.findMigrationBySchool(schoolId);

		if (!userLoginMigration) {
			return null;
		}

		const hasUserMigrated =
			!!userDO.lastLoginSystemChange && userDO.lastLoginSystemChange > userLoginMigration.startedAt;

		if (hasUserMigrated) {
			return null;
		}

		return userLoginMigration;
	}

	public async deleteUserLoginMigration(userLoginMigration: UserLoginMigrationDO): Promise<void> {
		await this.userLoginMigrationRepo.delete(userLoginMigration);
	}

	public hasMigrationClosed(userLoginMigration: UserLoginMigrationDO): boolean {
		const now = new Date();
		const hasClosed = !!userLoginMigration.closedAt && now > userLoginMigration.closedAt;
		return hasClosed;
	}
}
