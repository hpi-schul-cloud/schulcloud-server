import { Embeddable, Entity, Index, ManyToOne, Property, Unique, Reference } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from './base.entity';
import { User } from './user.entity';

export enum PermissionCrud {
	CREATE = 'CREATE',
	READ = 'READ',
	UPDATE = 'UPDATE',
	DELETE = 'DELETE',
}

@Embeddable()
export class UserDelta {
	constructor(
		data: { userId: string; includedPermissions: PermissionCrud[]; excludedPermissions: PermissionCrud[] }[]
	) {
		data.forEach((userDelta) => {
			this[userDelta.userId] = {
				includedPermissions: userDelta.includedPermissions,
				excludedPermissions: userDelta.excludedPermissions,
			};
		});
	}

	[userId: string]: {
		includedPermissions: PermissionCrud[];
		excludedPermissions: PermissionCrud[];
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

	@ManyToOne(() => PermissionContextEntity, { wrappedReference: true, fieldName: 'parentContext', nullable: true })
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
		includedPermissions: PermissionCrud[];
		excludedPermissions: PermissionCrud[];
	} {
		const userDelta = this.userDelta[userId] ?? { includedPermissions: [], excludedPermissions: [] };

		return userDelta;
	}

	public async resolvedPermissions(userId: User['id']): Promise<PermissionCrud[]> {
		const parent = await this.parentContext;
		let parentPermissions: PermissionCrud[] = [];
		if (parent) {
			parentPermissions = await parent.resolvedPermissions(userId);
		}
		const userDelta = this.resolveUserDelta(userId);

		const finalPermissions = parentPermissions
			.concat(userDelta.includedPermissions)
			.filter((permission) => !userDelta.excludedPermissions.includes(permission));

		return [...new Set(finalPermissions)];
	}

	public async resolveFullPermissionMatrix(): Promise<Map<string, PermissionCrud[]>> {
		const parent = await this.parentContext;
		let parentPermissionMatrix: Map<string, PermissionCrud[]> = new Map();
		if (parent) {
			parentPermissionMatrix = await parent.resolveFullPermissionMatrix();
		}

		const permissionMatrix = new Map(parentPermissionMatrix);

		Object.entries(this.userDelta).forEach(([userId, { includedPermissions, excludedPermissions }]) => {
			const parentPermissions = parentPermissionMatrix.get(userId) ?? [];
			const permissions = includedPermissions
				.concat(parentPermissions)
				.filter((permission) => !excludedPermissions.includes(permission));
			permissionMatrix.set(userId, permissions);
		});

		return permissionMatrix;
	}
}
