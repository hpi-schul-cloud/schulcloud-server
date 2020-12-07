const { removePermissionsThatUserCanAccess } = require('./applicationInternal/removePermissions');

const deleteUserData = async (userId) => {
	// step 1
	// await deletePersonalFiles(context);
	// step 2 -> Promise.all
	const result = await removePermissionsThatUserCanAccess(userId);
	// const replaceUserIds = await replaceUserId(userId); - step 2 or step 3

	// concatinate results

	return result;
};

module.exports = {
	deleteUserData,
};
