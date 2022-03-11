import { Collection, Entity, Property, ManyToMany } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { System } from './system.entity';

export interface ISchoolProperties {
	ldapSchoolIdentifier?: string;
	inMaintenanceSince?: Date;
	inUserMigration?: boolean;
	name: string;
	officialSchoolNumber?: string;
	systems?: System[];
}

@Entity({ tableName: 'schools' })
export class School extends BaseEntity {
	constructor(props: ISchoolProperties) {
		super();
		if (props.ldapSchoolIdentifier) this.ldapSchoolIdentifier = props.ldapSchoolIdentifier;
		if (props.inMaintenanceSince) this.inMaintenanceSince = props.inMaintenanceSince;
		if (props.inUserMigration !== null) this.inUserMigration = props.inUserMigration;
		this.name = props.name;
		if (props.officialSchoolNumber) this.officialSchoolNumber = props.officialSchoolNumber;
		if (props.systems) this.systems.set(props.systems);
	}

	@Property({ nullable: true })
	inMaintenanceSince?: Date;

	@Property({ nullable: true })
	inUserMigration?: boolean;

	@Property({ nullable: true })
	ldapSchoolIdentifier?: string;

	@Property()
	name: string;

	@Property({ nullable: true })
	officialSchoolNumber?: string;

	@ManyToMany('System', undefined, { fieldName: 'systems' })
	systems = new Collection<System>(this);
}
