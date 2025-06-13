import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '@shared/domain/entity';

export interface SchoolYearProperties {
	name: string;
	startDate: Date;
	endDate: Date;
	courseCreationInNextYear: boolean;
}

@Entity({ tableName: 'years' })
export class SchoolYearEntity extends BaseEntity implements SchoolYearProperties {
	@Property()
	name: string;

	@Property()
	startDate: Date;

	@Property()
	endDate: Date;

	@Property()
	courseCreationInNextYear: boolean;

	constructor(props: SchoolYearProperties) {
		super();
		this.name = props.name;
		this.startDate = props.startDate;
		this.endDate = props.endDate;
		this.courseCreationInNextYear = props.courseCreationInNextYear;
	}
}
