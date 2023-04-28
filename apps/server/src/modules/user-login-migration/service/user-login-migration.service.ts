import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityId, SchoolFeatures, SystemTypeEnum, UserLoginMigrationDO } from '@shared/domain';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { UserLoginMigrationRepo } from '@shared/repo/userloginmigration/user-login-migration.repo';
import { SchoolService } from '@src/modules/school';
import { SystemDto, SystemService } from '@src/modules/system/service';
import { UserService } from '@src/modules/user';
import { OauthMigrationDto } from './dto';

@Injectable()
export class UserLoginMigrationService {
	constructor(
		private readonly userService: UserService,
		private readonly userLoginMigrationRepo: UserLoginMigrationRepo,
		private readonly schoolService: SchoolService,
		private readonly systemService: SystemService
	) {}

	private async fillSchoolDoWithUserLoginMigration(schoolDo: SchoolDO): Promise<void> {
		if (!schoolDo.id) {
			throw new InternalServerErrorException('Cannot load UserLoginMigration without school id');
		}

		const userLoginMigration: UserLoginMigrationDO | null = await this.userLoginMigrationRepo.findBySchoolId(
			schoolDo.id
		);

		if (!userLoginMigration) {
			return;
		}

		schoolDo.oauthMigrationStart = userLoginMigration.startedAt;
		schoolDo.oauthMigrationPossible = !userLoginMigration.closedAt ? userLoginMigration.startedAt : undefined;
		schoolDo.oauthMigrationMandatory = userLoginMigration.mandatorySince;
		schoolDo.oauthMigrationFinished = userLoginMigration.closedAt;
		schoolDo.oauthMigrationFinalFinish = userLoginMigration.finishedAt;
	}

	private async saveUserLoginMigrationFromSchoolDo(schoolDo: SchoolDO): Promise<void> {
		if (!schoolDo.id) {
			throw new InternalServerErrorException('Cannot save UserLoginMigration without school id');
		}

		const oauthSystems: SystemDto[] = await this.systemService.findByType(SystemTypeEnum.OAUTH);
		const sanisSystem: SystemDto | undefined = oauthSystems.find(
			(system: SystemDto): boolean => system.alias === 'SANIS'
		);

		if (!sanisSystem) {
			throw new InternalServerErrorException('Cannot find SANIS system');
		}

		if (!schoolDo.oauthMigrationStart) {
			throw new InternalServerErrorException(`UserLoginMigration was never started for school ${schoolDo.id}`);
		}

		const systemIds: EntityId[] = schoolDo.systems
			? schoolDo.systems.filter((systemId: EntityId) => systemId !== (sanisSystem.id as string))
			: [];
		const sourceSystemId = systemIds.length >= 1 ? systemIds[0] : undefined;

		const existingUserLoginMigration: UserLoginMigrationDO | null = await this.userLoginMigrationRepo.findBySchoolId(
			schoolDo.id
		);

		const userLoginMigration: UserLoginMigrationDO = new UserLoginMigrationDO({
			id: existingUserLoginMigration ? existingUserLoginMigration.id : undefined,
			schoolId: schoolDo.id,
			targetSystemId: sanisSystem.id as string,
			sourceSystemId,
			mandatorySince: schoolDo.oauthMigrationMandatory,
			startedAt: schoolDo.oauthMigrationStart,
			closedAt: schoolDo.oauthMigrationFinished,
			finishedAt: schoolDo.oauthMigrationFinalFinish,
		});

		await this.userLoginMigrationRepo.save(userLoginMigration);
	}

	async setMigration(
		schoolId: EntityId,
		oauthMigrationPossible?: boolean,
		oauthMigrationMandatory?: boolean,
		oauthMigrationFinished?: boolean
	): Promise<OauthMigrationDto> {
		const schoolDo: SchoolDO = await this.schoolService.getSchoolById(schoolId);

		await this.fillSchoolDoWithUserLoginMigration(schoolDo);

		if (oauthMigrationPossible !== undefined) {
			if (this.isNewMigration(schoolDo)) {
				this.setMigrationStart(schoolDo, oauthMigrationPossible);
			} else {
				schoolDo.oauthMigrationPossible = this.setOrClearDate(oauthMigrationPossible);
				schoolDo.oauthMigrationFinalFinish = undefined;
			}

			this.enableOauthMigration(schoolDo);
		}
		if (oauthMigrationMandatory !== undefined) {
			schoolDo.oauthMigrationMandatory = this.setOrClearDate(oauthMigrationMandatory);
		}
		if (oauthMigrationFinished !== undefined) {
			schoolDo.oauthMigrationFinished = this.setOrClearDate(oauthMigrationFinished);
			this.calculateMigrationFinalFinish(schoolDo);
		}

		await this.schoolService.save(schoolDo);

		await this.saveUserLoginMigrationFromSchoolDo(schoolDo);

		const response: OauthMigrationDto = new OauthMigrationDto({
			oauthMigrationPossible: schoolDo.oauthMigrationPossible,
			oauthMigrationMandatory: schoolDo.oauthMigrationMandatory,
			oauthMigrationFinished: schoolDo.oauthMigrationFinished,
			oauthMigrationFinalFinish: schoolDo.oauthMigrationFinalFinish,
			enableMigrationStart: !!schoolDo.officialSchoolNumber,
		});

		return response;
	}

	private isNewMigration(schoolDo: SchoolDO): boolean {
		const isNewMigration: boolean = !schoolDo.oauthMigrationFinished && !schoolDo.oauthMigrationPossible;
		return isNewMigration;
	}

	private setOrClearDate(migrationFlag: boolean): Date | undefined {
		const result: Date | undefined = migrationFlag ? new Date() : undefined;
		return result;
	}

	private setMigrationStart(schoolDo: SchoolDO, oauthMigrationPossible: boolean): void {
		schoolDo.oauthMigrationPossible = this.setOrClearDate(oauthMigrationPossible);
		schoolDo.oauthMigrationStart = schoolDo.oauthMigrationPossible;
	}

	private calculateMigrationFinalFinish(schoolDo: SchoolDO) {
		if (schoolDo.oauthMigrationFinished) {
			schoolDo.oauthMigrationFinalFinish = new Date(
				schoolDo.oauthMigrationFinished.getTime() + (Configuration.get('MIGRATION_END_GRACE_PERIOD_MS') as number)
			);
		}
	}

	private enableOauthMigration(schoolDo: SchoolDO) {
		if (schoolDo.features && !schoolDo.features.includes(SchoolFeatures.OAUTH_PROVISIONING_ENABLED)) {
			schoolDo.features.push(SchoolFeatures.OAUTH_PROVISIONING_ENABLED);
		} else {
			schoolDo.features = [SchoolFeatures.OAUTH_PROVISIONING_ENABLED];
		}
	}

	async getMigration(schoolId: string): Promise<OauthMigrationDto> {
		const schoolDo: SchoolDO = await this.schoolService.getSchoolById(schoolId);

		const response: OauthMigrationDto = new OauthMigrationDto({
			oauthMigrationPossible: schoolDo.oauthMigrationPossible,
			oauthMigrationMandatory: schoolDo.oauthMigrationMandatory,
			oauthMigrationFinished: schoolDo.oauthMigrationFinished,
			oauthMigrationFinalFinish: schoolDo.oauthMigrationFinalFinish,
			enableMigrationStart: !!schoolDo.officialSchoolNumber,
		});

		return response;
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
