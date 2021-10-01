import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';

@Entity({ tableName: 'teams' })
export class Team extends BaseEntity {
	@Property()
	name!: string;

	constructor(props: { name: string }) {
		super();
		this.name = props.name;
	}
}
