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

	/** true if user is provided by external system -> no pw change in first login */
	systemId?: string;

	/** True if a support member impersonates the user */
	impersonated?: boolean;
}
