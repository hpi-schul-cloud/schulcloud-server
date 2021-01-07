const { ValidationError } = require('../../errors');

const { Forbidden } = require('../../errors');
const { isValid: isValidObjectId } = require('../../helper/compare').ObjectId;

const validateObjectId = (objectId) => {
	if (!isValidObjectId(objectId)) throw new ValidationError('a valid objectId is required', { objectId });
};

const checkPermissions = (schoolId, permissionToCheck, user) => {
	let grantPermission = true;
	// same school?
	grantPermission = grantPermission && user.schoolId.toString() === schoolId.toString();

	// user has permission
	grantPermission =
		grantPermission &&
		user.roles.some((role) => role.permissions.some((permission) => permission === permissionToCheck));

	if (!grantPermission) {
		throw new Forbidden(`You don't have permissions to perform this action`);
	}
};

module.exports = { validateObjectId, checkPermissions };
