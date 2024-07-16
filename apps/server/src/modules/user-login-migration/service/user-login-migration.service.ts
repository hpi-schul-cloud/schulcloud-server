import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { LegacySchoolService } from '@modules/legacy-school';
import { System, SystemService } from '@modules/system';
import { SystemType } from '@modules/system/domain';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { LegacySchoolDo, UserDO, UserLoginMigrationDO } from '@shared/domain/domainobject';
import { EntityId, SchoolFeature } from '@shared/domain/types';
import { UserLoginMigrationRepo } from '@shared/repo';
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
		private readonly systemService: SystemService
	) {}

	public async startMigration(schoolId: string): Promise<UserLoginMigrationDO> {
		const schoolDo: LegacySchoolDo = await this.schoolService.getSchoolById(schoolId);

		const userLoginMigrationDO: UserLoginMigrationDO = await this.createNewMigration(schoolDo);

		this.enableOauthMigrationFeature(schoolDo);
		await this.schoolService.save(schoolDo);

		const userLoginMigration: UserLoginMigrationDO = await this.userLoginMigrationRepo.save(userLoginMigrationDO);

		return userLoginMigration;
	}

	public async restartMigration(userLoginMigration: UserLoginMigrationDO): Promise<UserLoginMigrationDO> {
		this.checkGracePeriod(userLoginMigration);

		if (!userLoginMigration.closedAt || !userLoginMigration.finishedAt) {
			return userLoginMigration;
		}

		userLoginMigration.closedAt = undefined;
		userLoginMigration.finishedAt = undefined;

		const updatedUserLoginMigration: UserLoginMigrationDO = await this.userLoginMigrationRepo.save(userLoginMigration);

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

		const now: Date = new Date();
		const gracePeriodDuration: number = Configuration.get('MIGRATION_END_GRACE_PERIOD_MS') as number;

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
		const isGracePeriodExpired: boolean =
			!!userLoginMigration.finishedAt && Date.now() >= userLoginMigration.finishedAt.getTime();

		return isGracePeriodExpired;
	}

	private async createNewMigration(school: LegacySchoolDo): Promise<UserLoginMigrationDO> {
		const oauthSystems: System[] = await this.systemService.find({ types: [SystemType.OAUTH] });
		const moinSchuleSystem: System | undefined = oauthSystems.find((system: System) => system.alias === 'SANIS');

		if (!moinSchuleSystem) {
			throw new MoinSchuleSystemNotFoundLoggableException();
		} else if (school.systems?.includes(moinSchuleSystem.id)) {
			throw new IdenticalUserLoginMigrationSystemLoggableException(school.id, moinSchuleSystem.id);
		}

		const userLoginMigrationDO: UserLoginMigrationDO = new UserLoginMigrationDO({
			schoolId: school.id as string,
			targetSystemId: moinSchuleSystem.id,
			sourceSystemId: school.systems?.[0],
			startedAt: new Date(),
		});

		return userLoginMigrationDO;
	}

	private enableOauthMigrationFeature(schoolDo: LegacySchoolDo) {
		if (schoolDo.features && !schoolDo.features.includes(SchoolFeature.OAUTH_PROVISIONING_ENABLED)) {
			schoolDo.features.push(SchoolFeature.OAUTH_PROVISIONING_ENABLED);
		} else {
			schoolDo.features = [SchoolFeature.OAUTH_PROVISIONING_ENABLED];
		}
	}

	public async findMigrationBySchool(schoolId: string): Promise<UserLoginMigrationDO | null> {
		const userLoginMigration: UserLoginMigrationDO | null = await this.userLoginMigrationRepo.findBySchoolId(schoolId);

		return userLoginMigration;
	}

	public async findMigrationByUser(userId: EntityId): Promise<UserLoginMigrationDO | null> {
		const userDO: UserDO = await this.userService.findById(userId);
		const { schoolId } = userDO;

		const userLoginMigration: UserLoginMigrationDO | null = await this.findMigrationBySchool(schoolId);

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

	public async deleteUserLoginMigration(userLoginMigration: UserLoginMigrationDO): Promise<void> {
		await this.userLoginMigrationRepo.delete(userLoginMigration);
	}
}
