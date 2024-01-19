import { SchoolYear } from '../do';

export interface SchoolYearRepo {
	getAllSchoolYears(): Promise<SchoolYear[]>;
}

export const SCHOOL_YEAR_REPO = 'SCHOOL_YEAR_REPO';
