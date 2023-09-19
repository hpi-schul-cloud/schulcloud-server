import { DomainObject, AuthorizableObject } from '@shared/domain/domain-object';

export interface SchoolProps extends AuthorizableObject {
	name: string;

	officialSchoolNumber?: string;
}

export class School extends DomainObject<SchoolProps> {}
