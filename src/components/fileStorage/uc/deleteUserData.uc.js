const { removePermissionsThatUserCanAccess } = require('./applicationInternal/removePermissions');

const deleteUserData = [removePermissionsThatUserCanAccess];

module.exports = {
	deleteUserData,
};
