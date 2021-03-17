import { Forbidden } from '../../errors';

import type { ObjectId, TrashBinResult } from '../../../types';

function trashBinResult<T>({
	scope,
	data,
	complete,
}: {
	scope: string;
	data: T;
	complete: boolean;
}): TrashBinResult<T> {
	return { trashBinData: { scope, data }, complete };
}

type PermissionOperator = 'AND' | 'OR';

interface Role {
	permissions: string[];
}

interface User {
	schoolId: ObjectId;
	roles: Role[];
}

const checkPermissions = (
	user: User,
	schoolId: ObjectId,
	permissionsToCheck: string[],
	permissionOperator: PermissionOperator = 'AND'
): void => {
	let grantPermission = true;
	// same school?
	grantPermission = grantPermission && user.schoolId.toString() === schoolId.toString();

	// user has permission
	for (const permissionToCheck of permissionsToCheck) {
		const hasPermission = user.roles.some((role) =>
			role.permissions.some((permission) => permission === permissionToCheck)
		);
		if (hasPermission) {
			if (permissionOperator === 'OR') break;
		} else if (permissionOperator === 'AND') {
			grantPermission = false;
			break;
		}
	}

	if (!grantPermission) {
		throw new Forbidden(`You don't have permissions to perform this action`);
	}
};

export { checkPermissions, trashBinResult };
