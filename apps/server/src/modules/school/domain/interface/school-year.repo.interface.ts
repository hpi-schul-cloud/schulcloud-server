import { SchoolYearEntity } from '@modules/school/repo';
import { BaseRepo } from '@shared/repo/base.repo';
import { SchoolYear } from '../do';

export interface SchoolYearRepo extends BaseRepo<SchoolYearEntity> {
	findCurrentYear(): Promise<SchoolYearEntity>;
	findCurrentOrNextYear(): Promise<SchoolYearEntity>;
	getAllSchoolYears(): Promise<SchoolYear[]>;
}

export const SCHOOL_YEAR_REPO = 'SCHOOL_YEAR_REPO';
