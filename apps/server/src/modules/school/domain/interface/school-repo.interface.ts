import { EntityId, IFindOptions, SchoolEntity } from '@shared/domain';
import { School } from '../school';

export interface SchoolRepo {
	getAllSchools(options: IFindOptions<SchoolEntity>): Promise<School[]>;

	getSchool(schoolId: EntityId): Promise<School>;
}

// TODO: How to name the injection token? Should it be a string or a symbol? There are different approaches in our code. Shall we be consistent about it?
// It is even possible to give it the same name as the interface: https://stackoverflow.com/a/70088972/11854580 But that's probably confusing.
export const SCHOOL_REPO = 'SCHOOL_REPO';
