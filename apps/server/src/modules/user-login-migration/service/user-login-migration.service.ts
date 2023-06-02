import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Injectable, InternalServerErrorException, UnprocessableEntityException } from '@nestjs/common';
import { EntityId, SchoolDO, SchoolFeatures, SystemTypeEnum, UserDO, UserLoginMigrationDO } from '@shared/domain';
import { UserLoginMigrationRepo } from '@shared/repo';
import { SchoolService } from '@src/modules/school';
import { SystemDto, SystemService } from '@src/modules/system';
import { UserService } from '@src/modules/user';
import { RestartUserLoginMigrationError } from '../error';
import { SchoolMigrationService } from './school-migration.service';

@Injectable()
export class UserLoginMigrationService {
	constructor(
		private readonly userService: UserService,
		private readonly userLoginMigrationRepo: UserLoginMigrationRepo,
		private readonly schoolService: SchoolService,
		private readonly systemService: SystemService,
		private readonly schoolMigrationService: SchoolMigrationService
	) {}

	async setMigration(
		schoolId: EntityId,
		oauthMigrationPossible?: boolean,
		oauthMigrationMandatory?: boolean,
		oauthMigrationFinished?: boolean
	): Promise<UserLoginMigrationDO> {
		const schoolDo: SchoolDO = await this.schoolService.getSchoolById(schoolId);

		const existingUserLoginMigration: UserLoginMigrationDO | null = await this.userLoginMigrationRepo.findBySchoolId(
			schoolId
		);

		let userLoginMigration: UserLoginMigrationDO;

		if (existingUserLoginMigration) {
			userLoginMigration = existingUserLoginMigration;
		} else {
			if (!oauthMigrationPossible) {
				throw new UnprocessableEntityException(`School ${schoolId} has no UserLoginMigration`);
			}

			userLoginMigration = await this.createNewMigration(schoolDo);

			this.enableOauthMigrationFeature(schoolDo);
			await this.schoolService.save(schoolDo);
		}

		if (oauthMigrationPossible === true) {
			userLoginMigration.closedAt = undefined;
			userLoginMigration.finishedAt = undefined;
		}

		if (oauthMigrationMandatory !== undefined) {
			userLoginMigration.mandatorySince = oauthMigrationMandatory ? new Date() : undefined;
		}

		if (oauthMigrationFinished !== undefined) {
			userLoginMigration.closedAt = oauthMigrationFinished ? new Date() : undefined;
			userLoginMigration.finishedAt = oauthMigrationFinished
				? new Date(Date.now() + (Configuration.get('MIGRATION_END_GRACE_PERIOD_MS') as number))
				: undefined;
		}

		const savedMigration: UserLoginMigrationDO = await this.userLoginMigrationRepo.save(userLoginMigration);

		return savedMigration;
	}

	async startMigration(schoolId: string): Promise<UserLoginMigrationDO> {
		const schoolDo: SchoolDO = await this.schoolService.getSchoolById(schoolId);

		const userLoginMigrationDO: UserLoginMigrationDO = await this.createNewMigration(schoolDo);

		this.enableOauthMigrationFeature(schoolDo);
		await this.schoolService.save(schoolDo);

		const userLoginMigration: UserLoginMigrationDO = await this.userLoginMigrationRepo.save(userLoginMigrationDO);

		return userLoginMigration;
	}

	async restartMigration(schoolId: string): Promise<UserLoginMigrationDO> {
		const existingUserLoginMigrationDO: UserLoginMigrationDO | null = await this.userLoginMigrationRepo.findBySchoolId(
			schoolId
		);

		if (existingUserLoginMigrationDO === null) {
			throw new RestartUserLoginMigrationError(`Migration for school with id ${schoolId} does not exist for restart.`);
		}

		const updatedUserLoginMigration = await this.updateExistingMigration(existingUserLoginMigrationDO);
		await this.schoolMigrationService.unmarkOutdatedUsers(schoolId);

		return updatedUserLoginMigration;
	}

	private async createNewMigration(school: SchoolDO): Promise<UserLoginMigrationDO> {
		const oauthSystems: SystemDto[] = await this.systemService.findByType(SystemTypeEnum.OAUTH);
		const sanisSystem: SystemDto | undefined = oauthSystems.find((system: SystemDto) => system.alias === 'SANIS');

		if (!sanisSystem) {
			throw new InternalServerErrorException('Cannot find SANIS system');
		}

		const systemIds: EntityId[] =
			school.systems?.filter((systemId: EntityId) => systemId !== (sanisSystem.id as string)) || [];
		const sourceSystemId = systemIds[0];

		const userLoginMigrationDO: UserLoginMigrationDO = new UserLoginMigrationDO({
			schoolId: school.id as string,
			targetSystemId: sanisSystem.id as string,
			sourceSystemId,
			startedAt: new Date(),
		});

		return userLoginMigrationDO;
	}

	private async updateExistingMigration(userLoginMigrationDO: UserLoginMigrationDO) {
		userLoginMigrationDO.startedAt = new Date();
		userLoginMigrationDO.closedAt = undefined;
		userLoginMigrationDO.finishedAt = undefined;

		const userLoginMigration: UserLoginMigrationDO = await this.userLoginMigrationRepo.save(userLoginMigrationDO);

		return userLoginMigration;
	}

	private enableOauthMigrationFeature(schoolDo: SchoolDO) {
		if (schoolDo.features && !schoolDo.features.includes(SchoolFeatures.OAUTH_PROVISIONING_ENABLED)) {
			schoolDo.features.push(SchoolFeatures.OAUTH_PROVISIONING_ENABLED);
		} else {
			schoolDo.features = [SchoolFeatures.OAUTH_PROVISIONING_ENABLED];
		}
	}

	async findMigrationBySchool(schoolId: string): Promise<UserLoginMigrationDO | null> {
		const userLoginMigration: UserLoginMigrationDO | null = await this.userLoginMigrationRepo.findBySchoolId(schoolId);

		return userLoginMigration;
	}

	async findMigrationByUser(userId: EntityId): Promise<UserLoginMigrationDO | null> {
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
