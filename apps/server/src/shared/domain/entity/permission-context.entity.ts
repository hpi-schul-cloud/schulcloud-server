import { Embeddable, Entity, Index, ManyToOne, Property, Unique, Reference } from '@mikro-orm/core';
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

	@ManyToOne(() => PermissionContextEntity, { wrappedReference: true, fieldName: 'parentContext' })
	@Index()
	_parentContext: Reference<PermissionContextEntity> | null;

	constructor(props: IPermissionContextProperties) {
		super();
		this.contextReference = props.contextReference;
		this._parentContext = props.parentContext ? new Reference(props.parentContext) : null;
		this.name = props.name ?? null;
		this.userDelta = props.userDelta ?? new UserDelta([]);
	}

	get parentContext(): Promise<PermissionContextEntity | null> {
		if (!this._parentContext || this._parentContext.isInitialized()) {
			return Promise.resolve(this._parentContext?.getEntity() ?? null);
		}
		return this._parentContext.load();
	}

	private resolveUserDelta(userId: User['id']): {
		includedPermissions: Permission[];
		excludedPermissions: Permission[];
	} {
		const userDelta = this.userDelta[userId] ?? { includedPermissions: [], excludedPermissions: [] };

		return userDelta;
	}

	public async resolvedPermissions(userId: User['id']): Promise<Permission[]> {
		const parent = await this.parentContext;
		let parentPermissions: Permission[] = [];
		if (parent) {
			parentPermissions = await parent.resolvedPermissions(userId);
		}
		const userDelta = this.resolveUserDelta(userId);

		const finalPermissions = parentPermissions
			.concat(userDelta.includedPermissions)
			.filter((permission) => !userDelta.excludedPermissions.includes(permission));

		return [...new Set(finalPermissions)];
	}
}
