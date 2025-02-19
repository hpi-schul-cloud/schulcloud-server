import { SchoolYearEntity } from '@modules/school/repo';
import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { SchoolYear } from '../do';
import { SCHOOL_YEAR_REPO, SchoolYearRepo } from '../interface';

@Injectable()
export class SchoolYearService {
	constructor(@Inject(SCHOOL_YEAR_REPO) private readonly schoolYearRepo: SchoolYearRepo) {}

	// TODO: N21-990 Refactoring: Create domain objects for schoolYear and federalState
	public async getCurrentSchoolYear(): Promise<SchoolYearEntity> {
		const current = await this.schoolYearRepo.findCurrentYear();

		return current;
	}

	public async getCurrentOrNextSchoolYear(): Promise<SchoolYearEntity> {
		const currentOrNext = await this.schoolYearRepo.findCurrentOrNextYear();

		return currentOrNext;
	}

	public async findById(id: EntityId): Promise<SchoolYearEntity> {
		const year = await this.schoolYearRepo.findById(id);

		return year;
	}

	public async getAllSchoolYears(): Promise<SchoolYear[]> {
		const schoolYears = await this.schoolYearRepo.getAllSchoolYears();

		return schoolYears;
	}
}
