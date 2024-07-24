import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';

export class SchoolYear extends DomainObject<SchoolYearProps> {
	get startDate() {
		return this.props.startDate;
	}
}

export interface SchoolYearProps extends AuthorizableObject {
	name: string;
	startDate: Date;
	endDate: Date;
}
