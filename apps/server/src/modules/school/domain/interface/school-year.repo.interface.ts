import { type SchoolYearEntity } from '@modules/school/repo';
import { type BaseRepo } from '@shared/repo/base.repo';
import { type SchoolYear } from '../do';

export interface SchoolYearRepo extends BaseRepo<SchoolYearEntity> {
	findCurrentYear(): Promise<SchoolYearEntity>;
	findCurrentOrNextYear(): Promise<SchoolYearEntity>;
	getAllSchoolYears(): Promise<SchoolYear[]>;
}

export const SCHOOL_YEAR_REPO = 'SCHOOL_YEAR_REPO';
