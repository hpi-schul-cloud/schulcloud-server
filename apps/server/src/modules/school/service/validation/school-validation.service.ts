import { Injectable } from '@nestjs/common';
import { LegacySchoolDo } from '@shared/domain';
import { LegacySchoolRepo } from '@shared/repo';
import { SchoolNumberDuplicateLoggableException } from '../../error';

@Injectable()
export class SchoolValidationService {
	constructor(private readonly schoolRepo: LegacySchoolRepo) {}

	public async validate(school: LegacySchoolDo): Promise<void> {
		if (!(await this.isSchoolNumberUnique(school))) {
			throw new SchoolNumberDuplicateLoggableException(school.officialSchoolNumber as string);
		}
	}

	private async isSchoolNumberUnique(school: LegacySchoolDo): Promise<boolean> {
		if (!school.officialSchoolNumber) {
			return true;
		}

		const foundSchool: LegacySchoolDo | null = await this.schoolRepo.findBySchoolNumber(school.officialSchoolNumber);

		return foundSchool === null || foundSchool.id === school.id;
	}
}
