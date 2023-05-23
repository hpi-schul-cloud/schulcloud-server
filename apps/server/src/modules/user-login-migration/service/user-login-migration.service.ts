import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Injectable, InternalServerErrorException, UnprocessableEntityException } from '@nestjs/common';
import { EntityId, SchoolDO, SchoolFeatures, SystemTypeEnum, UserDO, UserLoginMigrationDO } from '@shared/domain';
import { UserLoginMigrationRepo } from '@shared/repo';
import { SchoolService } from '@src/modules/school';
import { SystemDto, SystemService } from '@src/modules/system';
import { UserService } from '@src/modules/user';

@Injectable()
export class UserLoginMigrationService {
	constructor(
		private readonly userService: UserService,
		private readonly userLoginMigrationRepo: UserLoginMigrationRepo,
		private readonly schoolService: SchoolService,
		private readonly systemService: SystemService
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

			userLoginMigration = await this.createNewMigration(schoolId, schoolDo);

			this.enableOauthMigrationFeature(schoolDo);
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
		schoolDo.userLoginMigrationId = savedMigration.id;
		await this.schoolService.save(schoolDo);

		return savedMigration;
	}

	private async createNewMigration(schoolId: EntityId, school: SchoolDO): Promise<UserLoginMigrationDO> {
		const oauthSystems: SystemDto[] = await this.systemService.findByType(SystemTypeEnum.OAUTH);
		const sanisSystem: SystemDto | undefined = oauthSystems.find((system: SystemDto) => system.alias === 'SANIS');

		if (!sanisSystem) {
			throw new InternalServerErrorException('Cannot find SANIS system');
		}

		const systemIds: EntityId[] =
			school.systems?.filter((systemId: EntityId) => systemId !== (sanisSystem.id as string)) || [];
		const sourceSystemId = systemIds[0];

		return new UserLoginMigrationDO({
			schoolId,
			targetSystemId: sanisSystem.id as string,
			sourceSystemId,
			startedAt: new Date(),
		});
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
