import { School } from '../school';

export interface SchoolRepo {
	getAllSchools(): Promise<School[]>;
}

// https://stackoverflow.com/a/70088972/11854580
export const SchoolRepo = Symbol('SchoolRepo');
