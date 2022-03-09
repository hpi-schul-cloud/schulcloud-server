import { Collection, Entity, Property, ManyToMany } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { System } from './system.entity';

export interface ISchoolProperties {
	name: string;
	systems?: System[];
}

@Entity({ tableName: 'schools' })
export class School extends BaseEntity {
	constructor(props: ISchoolProperties) {
		super();
		this.name = props.name;
		if (props.systems) this.systems.set(props.systems);
	}

	@Property()
	name!: string;

	@Property()
	inUserMigration?: boolean;

	@ManyToMany('System', undefined, { fieldName: 'systems' })
	systems = new Collection<System>(this);

	@Property()
	ldapSchoolIdentifier?: string;

	/* @Property()
    systems?: System[]; */
}
