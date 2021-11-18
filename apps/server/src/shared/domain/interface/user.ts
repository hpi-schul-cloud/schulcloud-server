import type { Role } from '../entity/role.entity';

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
	userId: string;
	/** users role ids as string[] */
	roles: string[];
	/** users schoolId as string */
	schoolId: string;
	/** account id as string */
	accountId: string;

	user: IResolvedUser;
}

export type IPermissionsAndRoles = {
	permissions: string[];
	roles: Role[];
};
