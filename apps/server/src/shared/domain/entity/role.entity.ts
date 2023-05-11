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

	public resolvePermissions(): string[] {
		if (!this.roles.isInitialized(true)) {
			throw new Error('Roles items are not loaded.');
		}

		let permissions: string[] = [...this.permissions];

		const innerRoles = this.roles.getItems();
		innerRoles.forEach((innerRole) => {
			const innerPermissions = innerRole.resolvePermissions();
			permissions = [...permissions, ...innerPermissions];
		});

		const uniquePermissions = [...new Set(permissions)];

		return uniquePermissions;
	}
}
