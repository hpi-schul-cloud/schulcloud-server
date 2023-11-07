import { IFindOptions } from '@shared/domain/interface/find-options';
import { EntityId } from '@shared/domain/types/entity-id';
import { School, SchoolProps } from '../do/school';
import { SchoolQuery } from '../query';

export interface SchoolRepo {
	getAllSchools(query: SchoolQuery, options: IFindOptions<SchoolProps>): Promise<School[]>;

	getSchool(schoolId: EntityId): Promise<School>;
}

// TODO: How to name the injection token? Should it be a string or a symbol? There are different approaches in our code. Shall we be consistent about it?
// It is even possible to give it the same name as the interface: https://stackoverflow.com/a/70088972/11854580 But that's probably confusing.
export const SCHOOL_REPO = 'SCHOOL_REPO';
