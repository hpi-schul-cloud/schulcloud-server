import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';

export interface ISchoolProperties {
	name: string;
}
@Entity({ tableName: 'schools' })
export class School extends BaseEntity {
	@Property()
	name: string;

	constructor(props: ISchoolProperties) {
		super();
		this.name = props.name;
	}
}
