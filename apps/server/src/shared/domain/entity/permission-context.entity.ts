import { Entity, Index, ManyToOne, Property } from '@mikro-orm/core';
import { ObjectId } from 'bson';
import { BaseEntityWithTimestamps } from './base.entity';
import { Role } from './role.entity';
import { Permission } from '../interface';

export interface IPermissionContextProperties {
	contextReference: ObjectId;
	role: Role | null;
	include_permissions: Permission[];
	exclude_permissions: Permission[];
	parent_context: PermissionContextEntity | null;
	createdAt: Date;
	updatedAt: Date;
}

// TODO: add test
@Entity({ tableName: 'permission-context' })
export class PermissionContextEntity extends BaseEntityWithTimestamps {
	@Property()
	@Index()
	contextReference: ObjectId;

	@Index()
	@ManyToOne(() => Role, { nullable: true })
	role: Role | null;

	@Property()
	included_permissions: Permission[] = [];

	@Property()
	excluded_permissions: Permission[] = [];

	@Property()
	@Index()
	parent_context: PermissionContextEntity | null;

	constructor(props: IPermissionContextProperties) {
		super();
		this.contextReference = props.contextReference;
		this.role = props.role;
		this.included_permissions = props.include_permissions;
		this.excluded_permissions = props.exclude_permissions;
		this.parent_context = props.parent_context;
	}

	public resolvedPermissions(): Permission[] {
		const parentContextPermissions: Permission[] = this.parent_context?.resolvedPermissions() ?? [];
		const rolePermissions = this.role?.resolvePermissions() ?? [];

		const finalPermissions = parentContextPermissions
			.concat(rolePermissions as Permission[])
			.concat(this.included_permissions)
			.filter((permission) => !this.excluded_permissions.includes(permission));

		return finalPermissions;
	}
}
