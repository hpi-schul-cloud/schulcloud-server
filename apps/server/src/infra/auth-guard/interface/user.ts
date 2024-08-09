/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { EntityId } from '@shared/domain/types';

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

	/** True if the user is an external user e.g. an oauth user or ldap user */
	isExternalUser: boolean;
}

export function isICurrentUser(user: any): user is ICurrentUser {
	return (
		typeof user?.userId === 'string' &&
		Array.isArray(user?.roles) &&
		(user?.roles as any[]).every((id: any) => typeof id === 'string') &&
		typeof user?.schoolId === 'string' &&
		typeof user?.accountId === 'string'
	);
}
