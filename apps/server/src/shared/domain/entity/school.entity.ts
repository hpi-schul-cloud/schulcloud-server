import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';

export interface ISchoolProperties {
	name: string;
}
@Entity({ tableName: 'schools' })
export class School extends BaseEntity {
	constructor(props: ISchoolProperties) {
		super();
		this.name = props.name;
	}

	@Property()
	name!: string;

	@Property()
	inUserMigration?: boolean;
}
