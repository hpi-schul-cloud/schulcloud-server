import { Check, Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';

export interface ISchoolYear {
	name: string;
	startDate: Date;
	endDate: Date;
}

@Entity({ tableName: 'years' })
export class SchoolYear extends BaseEntity implements ISchoolYear {
	@Property()
	@Check({ expression: '/^[0-9]{4}/[0-9]{2}$/.test(name)' })
	name: string;

	@Property()
	startDate = new Date();

	@Property()
	endDate = new Date();

	constructor(props: ISchoolYear) {
		super();
		this.name = props.name;
		this.startDate = props.startDate;
		this.endDate = props.endDate;
	}
}
