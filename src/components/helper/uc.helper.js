const { Forbidden, AssertionError } = require('../../errors');
const { equal: equalIds } = require('../../helper/compare').ObjectId;

const trashBinResult = ({ scope, data, complete }) => ({ trashBinData: { scope, data }, complete });

const validPermissionOperators = ['AND', 'OR'];

const isSuperhero = (currentUser) => currentUser.roles.some((role) => role.name === 'superhero');

const grantPermissionsForSchool = (currentUser, schoolId) =>
	equalIds(currentUser.schoolId, schoolId) || isSuperhero(currentUser);

const checkPermissions = (user, schoolId, permissionsToCheck, permissionOperator = 'AND') => {
	let grantPermission = true;
	// same school?
	grantPermission = grantPermission && grantPermissionsForSchool(user, schoolId);

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

module.exports = { checkPermissions, trashBinResult, grantPermissionsForSchool };
