import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';

export interface ISchoolYearProperties {
	name: string;
	startDate: Date;
	endDate: Date;
}

@Entity({ tableName: 'years' })
export class SchoolYearEntity extends BaseEntity implements ISchoolYearProperties {
	@Property()
	name: string;

	@Property()
	startDate: Date;

	@Property()
	endDate: Date;

	constructor(props: ISchoolYearProperties) {
		super();
		this.name = props.name;
		this.startDate = props.startDate;
		this.endDate = props.endDate;
	}
}
