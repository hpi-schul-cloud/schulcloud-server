import { IFindOptions } from '@shared/domain/interface/find-options';
import { EntityId } from '@shared/domain/types/entity-id';
import { School, SchoolProps } from '../do/school';
import { SchoolQuery } from '../query';

export interface SchoolRepo {
	getSchools(query: SchoolQuery, options?: IFindOptions<SchoolProps>): Promise<School[]>;

	getSchoolById(schoolId: EntityId): Promise<School>;

	getSchoolByOfficialSchoolNumber(officialSchoolNumber: string): Promise<School | null>;

	getSchoolsBySystemIds(systemIds: EntityId[]): Promise<School[]>;

	save(domainObject: School): Promise<School>;
}

export const SCHOOL_REPO = 'SCHOOL_REPO';
