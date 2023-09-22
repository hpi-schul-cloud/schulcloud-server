import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';

export class SchoolYear extends DomainObject<SchoolYearProps> {}

interface SchoolYearProps extends AuthorizableObject {
	name: string;
	startDate: Date;
	endDate: Date;
}
