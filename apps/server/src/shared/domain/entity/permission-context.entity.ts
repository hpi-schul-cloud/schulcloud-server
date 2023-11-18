import { Embeddable, Entity, Index, ManyToOne, Property, Unique } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from './base.entity';
import { Permission } from '../interface';
import { User } from './user.entity';

@Embeddable()
export class UserDelta {
	constructor(data: { userId: string; includedPermissions: Permission[]; excludedPermissions: Permission[] }[]) {
		data.forEach((userDelta) => {
			this[userDelta.userId] = {
				includedPermissions: userDelta.includedPermissions,
				excludedPermissions: userDelta.excludedPermissions,
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

@Entity({ tableName: 'permission-context' })
export class PermissionContextEntity extends BaseEntityWithTimestamps {
	@Property()
	@Unique()
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

	private resolveUserDelta(userId: User['id']): {
		includedPermissions: Permission[];
		excludedPermissions: Permission[];
	} {
		const userDelta = this.userDelta[userId] ?? { includedPermissions: [], excludedPermissions: [] };

		return userDelta;
	}

	public resolvedPermissions(userId: User['id']): Permission[] {
		const parentPermissions = this.parentContext?.resolvedPermissions(userId) ?? [];

		const userDelta = this.resolveUserDelta(userId);

		const finalPermissions = parentPermissions
			.concat(userDelta.includedPermissions)
			.filter((permission) => !userDelta.excludedPermissions.includes(permission));

		return [...new Set(finalPermissions)];
	}
}
