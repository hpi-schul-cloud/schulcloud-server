import { Collection, Entity, ManyToMany, Property, Unique } from '@mikro-orm/core';
import { Permission, RoleName } from '../interface';
import { BaseEntityWithTimestamps } from './base.entity';

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
