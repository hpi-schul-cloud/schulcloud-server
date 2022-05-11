import { Entity, Property, ManyToMany, Collection, Unique } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';
import { RoleName } from '../rules/rolename.enum';
import { Permission } from '../rules/permission.enum';

export interface IRoleProperties {
	permissions?: Permission[];
	roles?: Role[];
	name: RoleName;
}

@Entity({ tableName: 'roles' })
export class Role extends BaseEntityWithTimestamps {
	@Property()
	@Unique()
	name: RoleName;

	@Property()
	permissions: Permission[] = [];

	@ManyToMany({ entity: 'Role' })
	roles = new Collection<Role>(this);

	constructor(props: IRoleProperties) {
		super();
		this.name = props.name;
		if (props.permissions) this.permissions = props.permissions;
		if (props.roles) this.roles.set(props.roles);
	}
}
