import { type IFindOptions } from '@shared/domain/interface/find-options';
import { type EntityId } from '@shared/domain/types/entity-id';
import { type School, type SchoolProps } from '../do/school';
import { type SchoolQuery } from '../query';

export interface SchoolRepo {
	getSchools(query: SchoolQuery, options?: IFindOptions<SchoolProps>): Promise<School[]>;

	getSchoolList(
		options: IFindOptions<SchoolProps>,
		federalStateId?: EntityId
	): Promise<{ schools: School[]; count: number }>;

	getSchoolById(schoolId: EntityId): Promise<School>;

	getSchoolsByIds(schoolIds: EntityId[]): Promise<School[]>;

	getSchoolByOfficialSchoolNumber(officialSchoolNumber: string): Promise<School | null>;

	getSchoolsBySystemIds(systemIds: EntityId[]): Promise<School[]>;

	getAllSchoolIds(): Promise<EntityId[]>;

	hasLdapSystem(schoolId: EntityId): Promise<boolean>;

	save(domainObject: School): Promise<School>;
}

export const SCHOOL_REPO = 'SCHOOL_REPO';
