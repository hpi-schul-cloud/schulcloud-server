import { Injectable } from '@nestjs/common';
import { SchoolDO } from '@shared/domain';
import { LegacySchoolRepo } from '@shared/repo';
import { SchoolNumberDuplicateLoggableException } from '../../error';

@Injectable()
export class SchoolValidationService {
	constructor(private readonly schoolRepo: LegacySchoolRepo) {}

	public async validate(school: SchoolDO): Promise<void> {
		if (!(await this.isSchoolNumberUnique(school))) {
			throw new SchoolNumberDuplicateLoggableException(school.officialSchoolNumber as string);
		}
	}

	private async isSchoolNumberUnique(school: SchoolDO): Promise<boolean> {
		if (!school.officialSchoolNumber) {
			return true;
		}

		const foundSchool: SchoolDO | null = await this.schoolRepo.findBySchoolNumber(school.officialSchoolNumber);

		return foundSchool === null || foundSchool.id === school.id;
	}
}
