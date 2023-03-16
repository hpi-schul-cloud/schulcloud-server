import { Injectable } from '@nestjs/common';
import { EntityId, SchoolFeatures } from '@shared/domain';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { SchoolRepo } from '@shared/repo';
import { OauthMigrationDto } from '../dto/oauth-migration.dto';

@Injectable()
export class SchoolService {
	constructor(private readonly schoolRepo: SchoolRepo) {}

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

	async setMigration(
		schoolId: EntityId,
		oauthMigrationPossible?: boolean,
		oauthMigrationMandatory?: boolean,
		oauthMigrationFinished?: boolean
	): Promise<OauthMigrationDto> {
		const schoolDo: SchoolDO = await this.schoolRepo.findById(schoolId);
		if (oauthMigrationPossible != null) {
			schoolDo.oauthMigrationPossible = oauthMigrationPossible ? new Date() : undefined;

			this.enableOauthMigration(schoolDo);
		}
		if (oauthMigrationMandatory != null) {
			schoolDo.oauthMigrationMandatory = oauthMigrationMandatory ? new Date() : undefined;
		}
		if (oauthMigrationFinished != null) {
			schoolDo.oauthMigrationFinished = oauthMigrationFinished ? new Date() : undefined;
		}

		await this.schoolRepo.save(schoolDo);

		const response: OauthMigrationDto = new OauthMigrationDto({
			oauthMigrationPossible: schoolDo.oauthMigrationPossible,
			oauthMigrationMandatory: schoolDo.oauthMigrationMandatory,
			oauthMigrationFinished: schoolDo.oauthMigrationFinished,
			enableMigrationStart: !!schoolDo.officialSchoolNumber,
		});

		return response;
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
