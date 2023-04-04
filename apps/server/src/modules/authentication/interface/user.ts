import { EntityId } from '@shared/domain';

export interface IRole {
	name: string;

	id: string;
}

export interface IResolvedUser {
	firstName: string;

	lastName: string;

	id: string;

	createdAt: Date;

	updatedAt: Date;

	roles: IRole[];

	permissions: string[];

	schoolId: string;
}

export interface ICurrentUser {
	/** authenticated users id */
	userId: EntityId;
	/** users role ids as EntityId[] */
	roles: EntityId[];
	/** users schoolId as EntityId */
	schoolId: EntityId;
	/** account id as EntityId */
	accountId: EntityId;

	/** true if user is provided by external system -> no pw change in first login */
	systemId?: EntityId;

	/** True if a support member impersonates the user */
	impersonated?: boolean;
}
