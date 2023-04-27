import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityId, SchoolFeatures, SystemTypeEnum, UserLoginMigrationDO } from '@shared/domain';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { SchoolRepo } from '@shared/repo';
import { SystemService } from '@src/modules/system';
import { SystemDto } from '@src/modules/system/service';
import { UserLoginMigrationService } from '@src/modules/user-login-migration';
import { OauthMigrationDto } from '../dto/oauth-migration.dto';

@Injectable()
export class SchoolService {
	constructor(
		private readonly schoolRepo: SchoolRepo,
		private readonly userLoginMigrationService: UserLoginMigrationService,
		private readonly systemService: SystemService
	) {}

	async createOrUpdateSchool(school: SchoolDO): Promise<SchoolDO> {
		let createdSchool: SchoolDO;
		if (school.id) {
			createdSchool = await this.patchSchool(school);
		} else {
			createdSchool = await this.schoolRepo.save(school);
		}
		return createdSchool;
	}

	async hasFeature(schoolId: EntityId, feature: SchoolFeatures): Promise<boolean> {
		const entity: SchoolDO = await this.schoolRepo.findById(schoolId);
		return entity.features ? entity.features.includes(feature) : false;
	}

	private async fillSchoolDoWithUserLoginMigration(schoolDo: SchoolDO): Promise<void> {
		if (!schoolDo.userLoginMigrationId) {
			return;
		}

		const userLoginMigration: UserLoginMigrationDO = await this.userLoginMigrationService.findById(
			schoolDo.userLoginMigrationId
		);

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

		const userLoginMigration: UserLoginMigrationDO = new UserLoginMigrationDO({
			id: schoolDo.userLoginMigrationId,
			schoolId: schoolDo.id,
			targetSystemId: sanisSystem.id as string,
			sourceSystemId: schoolDo.systems && schoolDo.systems.length >= 1 ? schoolDo.systems[0] : undefined,
			mandatorySince: schoolDo.oauthMigrationMandatory,
			startedAt: schoolDo.oauthMigrationStart,
			closedAt: schoolDo.oauthMigrationFinished,
			finishedAt: schoolDo.oauthMigrationFinalFinish,
		});

		await this.userLoginMigrationService.save(userLoginMigration);
	}

	async setMigration(
		schoolId: EntityId,
		oauthMigrationPossible?: boolean,
		oauthMigrationMandatory?: boolean,
		oauthMigrationFinished?: boolean
	): Promise<OauthMigrationDto> {
		const schoolDo: SchoolDO = await this.schoolRepo.findById(schoolId);

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

		await this.schoolRepo.save(schoolDo);

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
		const schoolDo: SchoolDO = await this.schoolRepo.findById(schoolId);

		const response: OauthMigrationDto = new OauthMigrationDto({
			oauthMigrationPossible: schoolDo.oauthMigrationPossible,
			oauthMigrationMandatory: schoolDo.oauthMigrationMandatory,
			oauthMigrationFinished: schoolDo.oauthMigrationFinished,
			oauthMigrationFinalFinish: schoolDo.oauthMigrationFinalFinish,
			enableMigrationStart: !!schoolDo.officialSchoolNumber,
		});

		return response;
	}

	async getSchoolById(id: string): Promise<SchoolDO> {
		const schoolDO: SchoolDO = await this.schoolRepo.findById(id);
		return schoolDO;
	}

	async getSchoolByExternalId(externalId: string, systemId: string): Promise<SchoolDO | null> {
		const schoolDO: SchoolDO | null = await this.schoolRepo.findByExternalId(externalId, systemId);
		return schoolDO;
	}

	async getSchoolBySchoolNumber(schoolNumber: string): Promise<SchoolDO | null> {
		const schoolDO: SchoolDO | null = await this.schoolRepo.findBySchoolNumber(schoolNumber);
		return schoolDO;
	}

	async save(school: SchoolDO): Promise<SchoolDO> {
		const ret: SchoolDO = await this.schoolRepo.save(school);
		return ret;
	}

	private async patchSchool(school: SchoolDO) {
		const entity: SchoolDO = await this.schoolRepo.findById(school.id as string);
		const patchedEntity: SchoolDO = { ...entity, ...school };

		await this.schoolRepo.save(patchedEntity);

		return patchedEntity;
	}
}
