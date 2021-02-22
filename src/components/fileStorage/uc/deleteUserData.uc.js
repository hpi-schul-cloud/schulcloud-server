const { removePermissionsThatUserCanAccess } = require('./applicationInternal/removePermissions');
const { removePersonalFiles } = require('./applicationInternal/removeFiles');

const deleteUserData = [removePermissionsThatUserCanAccess, removePersonalFiles];

module.exports = {
	private: {
		removePermissionsThatUserCanAccess, // ToDo: Add more..
	},
	deleteUserData,
};
