import { Entity, Property, Unique, Index } from '@mikro-orm/core';
import { BaseEntityWithTimestamps, EntityId } from '@shared/domain';

export interface IRoleProperties {
	permissions?: string[];
	roles?: EntityId[];
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

	@Property()
	roles: EntityId[] = [];

	constructor(props: IRoleProperties) {
		super();
		this.name = props.name;
		this.permissions = props.permissions || [];
		this.roles = props.roles || [];
		// Object.assign(this, { roles: props.roles });
	}
}

export type IPermissionsAndRoles = {
	permissions: string[];
	roles: Role[];
};
