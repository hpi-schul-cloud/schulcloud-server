import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';

export class SchoolYear extends DomainObject<SchoolYearProps> {
	get name(): string {
		return this.props.name;
	}

	get startDate(): Date {
		return this.props.startDate;
	}
}

export interface SchoolYearProps extends AuthorizableObject {
	name: string;
	startDate: Date;
	endDate: Date;
}
