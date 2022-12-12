import { SchoolMapper } from '@src/modules/school/mapper/school.mapper';
import { SchoolRepo } from '@shared/repo';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { EntityId, SchoolFeatures } from '@shared/domain';
import { Injectable } from '@nestjs/common';
import { MigrationResponse } from '../controller/dto';
import { ProvisioningSchoolOutputDto } from '../../provisioning/dto/provisioning-school-output.dto';
import { SchoolUcMapper } from '../mapper/school.uc.mapper';

@Injectable()
export class SchoolService {
	constructor(readonly schoolRepo: SchoolRepo) {}

	async saveProvisioningSchoolOutputDto(schoolDto: ProvisioningSchoolOutputDto): Promise<SchoolDO> {
		return this.createOrUpdateSchool(SchoolUcMapper.mapFromProvisioningSchoolOutputDtoToSchoolDO(schoolDto));
	}

	async createOrUpdateSchool(school: SchoolDO): Promise<SchoolDO> {
		let createdSchool: SchoolDO;
		if (school.id) {
			createdSchool = await this.patchSchool(school);
		} else {
			createdSchool = await this.schoolRepo.save(school);
		}
		return createdSchool;
	}

	private async patchSchool(school: SchoolDO) {
		const entity: SchoolDO = await this.schoolRepo.findById(school.id as string);
		const patchedEntity: SchoolDO = { ...entity, ...school };

		await this.schoolRepo.save(patchedEntity);

		return patchedEntity;
	}

	async hasFeature(schoolId: EntityId, feature: SchoolFeatures): Promise<boolean> {
		const entity: SchoolDO = await this.schoolRepo.findById(schoolId);
		return entity.features ? entity.features.includes(feature) : false;
	}

	async setMigration(
		schoolId: EntityId,
		oauthMigrationPossible: boolean,
		oauthMigrationMandatory: boolean
	): Promise<MigrationResponse> {
		const entity: SchoolDO = await this.schoolRepo.findById(schoolId);
		entity.oauthMigrationPossible = oauthMigrationPossible;
		entity.oauthMigrationMandatory = oauthMigrationMandatory;

		await this.schoolRepo.save(entity);

		const response: MigrationResponse = new MigrationResponse({
			oauthMigrationPossible: entity.oauthMigrationPossible,
			oauthMigrationMandatory: entity.oauthMigrationMandatory,
		});

		return response;
	}

	async getSchoolById(id: string): Promise<SchoolDO> {
		const schoolDO: SchoolDO = await this.schoolRepo.findById(id);
		return schoolDO;
	}

	async save(school: SchoolDO): Promise<SchoolDO> {
		const ret: SchoolDO = await this.schoolRepo.save(school);
		return ret;
	}
}
