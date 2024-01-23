import { Inject, Injectable } from '@nestjs/common';
import { SchoolYear } from '../do';
import { SchoolYearRepo, SCHOOL_YEAR_REPO } from '../interface';

@Injectable()
export class SchoolYearService {
	constructor(@Inject(SCHOOL_YEAR_REPO) private readonly schoolYearRepo: SchoolYearRepo) {}

	public async getAllSchoolYears(): Promise<SchoolYear[]> {
		const schoolYears = await this.schoolYearRepo.getAllSchoolYears();

		return schoolYears;
	}
}
