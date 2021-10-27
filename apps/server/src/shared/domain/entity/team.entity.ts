import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';

export interface ITeamProperties {
	name: string;
}
@Entity({ tableName: 'teams' })
export class Team extends BaseEntity {
	@Property()
	name!: string;

	constructor(props: ITeamProperties) {
		super();
		this.name = props.name;
	}
}
