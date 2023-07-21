import { Injectable } from '@nestjs/common';
import { EntityId, SchoolFeatures } from '@shared/domain';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { SchoolRepo } from '@shared/repo';
import { SchoolValidationService } from './validation/school-validation.service';

@Injectable()
export class SchoolService {
	constructor(
		private readonly schoolRepo: SchoolRepo,
		private readonly schoolValidationService: SchoolValidationService
	) {}

	async hasFeature(schoolId: EntityId, feature: SchoolFeatures): Promise<boolean> {
		const entity: SchoolDO = await this.schoolRepo.findById(schoolId);
		return entity.features ? entity.features.includes(feature) : false;
	}

	async removeFeature(schoolId: EntityId, feature: SchoolFeatures): Promise<void> {
		const school: SchoolDO = await this.schoolRepo.findById(schoolId);
		if (school.features && school.features.includes(feature)) {
			school.features = school.features.filter((f: SchoolFeatures) => f !== feature);
			await this.schoolRepo.save(school);
		}
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

	async save(school: SchoolDO, validate = false): Promise<SchoolDO> {
		if (validate) {
			await this.schoolValidationService.validate(school);
		}

		const ret: SchoolDO = await this.schoolRepo.save(school);

		return ret;
	}
}
