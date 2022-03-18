import { Collection, Entity, Property, ManyToMany, Index } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { System } from './system.entity';

export interface ISchoolProperties {
	name: string;
	systems?: System[];
}

@Entity({ tableName: 'schools' })
@Index({ properties: ['ldapSchoolIdentifier', 'systems'] })
export class School extends BaseEntity {
	constructor(props: ISchoolProperties) {
		super();
		this.name = props.name;
		if (props.systems) this.systems.set(props.systems);
	}

	@Property()
	name: string;

	@Property({ nullable: true })
	inUserMigration?: boolean;

	@ManyToMany('System', undefined, { fieldName: 'systems' })
	systems = new Collection<System>(this);

	@Property({ nullable: true })
	ldapSchoolIdentifier?: string;
}
