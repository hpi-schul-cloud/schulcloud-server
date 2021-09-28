import { Entity, Property, Unique, Index, ManyToMany, Collection } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';

export interface IRoleProperties {
	permissions?: string[];
	roles?: Role[];
	name: string;
}

@Entity({ tableName: 'roles' })
export class Role extends BaseEntityWithTimestamps {
	@Property()
	@Index({ name: 'primaryRoleSearchOperation' })
	@Unique()
	name: string;

	// @Enum({ items: ['a', 'b', 'c'] }) in array with no permission is valid => validator function
	@Property()
	permissions: string[] = [];
	// TODO: enum

	// @ManyToMany('Role', 'roles')
	// roles = new Collection<Role>(this);

	// @ManyToMany({ fieldName: 'roles', type: Role })
	// roles = new Collection<Role>(this);

	@ManyToMany('Role')
	roles = new Collection<Role>(this);

	constructor(props: IRoleProperties) {
		super();
		this.name = props.name;
		if (props.permissions) this.permissions = props.permissions;
		if (props.roles) this.roles.set(props.roles);
	}
}
