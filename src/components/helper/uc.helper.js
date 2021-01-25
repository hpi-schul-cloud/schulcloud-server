const { Forbidden, AssertionError } = require('../../errors');

const trashBinResult = ({ scope, data, complete }) => {
	return { trashBinData: [{ scope, data }], complete };
};

const validPermissionOperators = ['AND', 'OR'];

const checkPermissions = (user, schoolId, permissionsToCheck, permissionOperator = 'AND') => {
	let grantPermission = true;
	// same school?
	grantPermission = grantPermission && user.schoolId.toString() === schoolId.toString();

	if (!validPermissionOperators.includes(permissionOperator)) {
		throw new AssertionError('no such permission operator');
	}

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

module.exports = { checkPermissions, trashBinResult };
