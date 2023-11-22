import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';

export interface SchoolYearProperties {
	name: string;
	startDate: Date;
	endDate: Date;
}

@Entity({ tableName: 'years' })
export class SchoolYearEntity extends BaseEntity implements SchoolYearProperties {
	@Property()
	name: string;

	@Property()
	startDate: Date;

	@Property()
	endDate: Date;

	constructor(props: SchoolYearProperties) {
		super();
		this.name = props.name;
		this.startDate = props.startDate;
		this.endDate = props.endDate;
	}
}
