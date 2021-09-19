import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';

@Entity({ tableName: 'schools' })
export class School extends BaseEntity {
	@Property()
	name!: string;

	constructor(props: { name: string }) {
		super();
		this.name = props.name;
	}
}
