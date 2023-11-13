import { Embeddable, Entity, Index, ManyToOne, Property } from '@mikro-orm/core';
import { ObjectId } from 'bson';
import { BaseEntityWithTimestamps } from './base.entity';
import { Permission } from '../interface';
import { User } from './user.entity';

@Embeddable()
export class UserDelta {
	constructor(data: { userId: string; included_permissions: Permission[]; excluded_permissions: Permission[] }[]) {
		data.forEach((userDelta) => {
			this[userDelta.userId] = {
				includedPermissions: userDelta.included_permissions,
				excludedPermissions: userDelta.excluded_permissions,
			};
		});
	}

	[userId: string]: {
		includedPermissions: Permission[];
		excludedPermissions: Permission[];
	};
}

export interface IPermissionContextProperties {
	name?: string | null;
	userDelta?: UserDelta;
	contextReference: ObjectId;
	parentContext: PermissionContextEntity | null;
}

// TODO: add test
@Entity({ tableName: 'permission-context' })
export class PermissionContextEntity extends BaseEntityWithTimestamps {
	@Property()
	@Index()
	contextReference: ObjectId;

	@Property()
	name: string | null;

	@Index()
	@Property()
	userDelta: UserDelta;

	@ManyToOne(() => PermissionContextEntity, { nullable: true })
	@Index()
	parentContext: PermissionContextEntity | null;

	constructor(props: IPermissionContextProperties) {
		super();
		this.contextReference = props.contextReference;
		this.parentContext = props.parentContext;
		this.name = props.name ?? null;
		this.userDelta = props.userDelta ?? new UserDelta([]);
	}

	private resolveUserDelta(user: User): {
		includedPermissions: Permission[];
		excludedPermissions: Permission[];
	} {
		const userDelta = this.userDelta[user.id] ?? { includedPermissions: [], excludedPermissions: [] };

		return userDelta;
	}

	public resolvedPermissions(user: User): Permission[] {
		const parentPermissions = this.parentContext?.resolvedPermissions(user) ?? [];

		const userDelta = this.resolveUserDelta(user);

		const finalPermissions = parentPermissions
			.concat(userDelta.includedPermissions)
			.filter((permission) => !userDelta.excludedPermissions.includes(permission));

		return [...new Set(finalPermissions)];
	}
}
