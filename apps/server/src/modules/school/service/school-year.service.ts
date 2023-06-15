import { Injectable } from '@nestjs/common';
import { SchoolYearRepo } from '@shared/repo/schoolyear';
import { SchoolYear } from '@shared/domain';

@Injectable()
export class SchoolYearService {
	constructor(private readonly schoolYearRepo: SchoolYearRepo) {}

	// TODO: N21-990 Refactoring: Create domain objects for schoolYear and federalState
	async getCurrentSchoolYear(): Promise<SchoolYear> {
		const current: SchoolYear = await this.schoolYearRepo.findCurrentYear();
		return current;
	}
}
