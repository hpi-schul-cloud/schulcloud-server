import { Injectable } from '@nestjs/common';
import { EntityId, SchoolFeatures } from '@shared/domain';
import { LegacySchoolDo } from '@shared/domain/domainobject/school.do';
import { LegacySchoolRepo } from '@shared/repo';
import { SchoolValidationService } from './validation';

@Injectable()
export class LegacySchoolService {
	constructor(
		private readonly schoolRepo: LegacySchoolRepo,
		private readonly schoolValidationService: SchoolValidationService
	) {}

	async hasFeature(schoolId: EntityId, feature: SchoolFeatures): Promise<boolean> {
		const entity: LegacySchoolDo = await this.schoolRepo.findById(schoolId);
		return entity.features ? entity.features.includes(feature) : false;
	}

	async removeFeature(schoolId: EntityId, feature: SchoolFeatures): Promise<void> {
		const school: LegacySchoolDo = await this.schoolRepo.findById(schoolId);
		if (school.features && school.features.includes(feature)) {
			school.features = school.features.filter((f: SchoolFeatures) => f !== feature);
			await this.schoolRepo.save(school);
		}
	}

	async getSchoolById(id: string): Promise<LegacySchoolDo> {
		const schoolDO: LegacySchoolDo = await this.schoolRepo.findById(id);

		return schoolDO;
	}

	async getSchoolByExternalId(externalId: string, systemId: string): Promise<LegacySchoolDo | null> {
		const schoolDO: LegacySchoolDo | null = await this.schoolRepo.findByExternalId(externalId, systemId);

		return schoolDO;
	}

	async getSchoolBySchoolNumber(schoolNumber: string): Promise<LegacySchoolDo | null> {
		const schoolDO: LegacySchoolDo | null = await this.schoolRepo.findBySchoolNumber(schoolNumber);

		return schoolDO;
	}

	async save(school: LegacySchoolDo, validate = false): Promise<LegacySchoolDo> {
		if (validate) {
			await this.schoolValidationService.validate(school);
		}

		const ret: LegacySchoolDo = await this.schoolRepo.save(school);

		return ret;
	}
}
