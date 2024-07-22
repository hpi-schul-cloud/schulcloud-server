import { Injectable } from '@nestjs/common';
import { LegacySchoolDo } from '@shared/domain/domainobject';
import { EntityId, SchoolFeature } from '@shared/domain/types';
import { LegacySchoolRepo } from '@shared/repo';
import { FederalStateService } from './federal-state.service';
import { SchoolValidationService } from './validation';
import { SchoolYearService } from './school-year.service';

/**
 * @deprecated because it uses the deprecated LegacySchoolDo.
 */
@Injectable()
export class LegacySchoolService {
	constructor(
		private readonly schoolRepo: LegacySchoolRepo,
		private readonly schoolValidationService: SchoolValidationService,
		private readonly federalStateService: FederalStateService,
		private readonly schoolYearService: SchoolYearService
	) {}

	async hasFeature(schoolId: EntityId, feature: SchoolFeature): Promise<boolean> {
		const entity: LegacySchoolDo = await this.schoolRepo.findById(schoolId);
		return entity.features ? entity.features.includes(feature) : false;
	}

	async removeFeature(schoolId: EntityId, feature: SchoolFeature): Promise<void> {
		const school: LegacySchoolDo = await this.schoolRepo.findById(schoolId);
		if (school.features && school.features.includes(feature)) {
			school.features = school.features.filter((f: SchoolFeature) => f !== feature);
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

	async createSchool(props: { name: string; federalStateName: string }): Promise<LegacySchoolDo> {
		const federalState = await this.federalStateService.findFederalStateByName(props.federalStateName);
		const schoolYear = await this.schoolYearService.getCurrentOrNextSchoolYear();
		const defaults = {
			// fileStorageType: 'awsS3',
			schoolYear,
			permissions: {
				teacher: {
					STUDENT_LIST: true,
				},
			},
		};
		const school = new LegacySchoolDo({ ...defaults, name: props.name, federalState });
		await this.schoolRepo.save(school);
		return school;
	}
}
