// todo test?

const updateManyResultDAO2BO = ({ n, nModified, ok }) => {
	// todo is ok === 0 possible or does it throw?
	if (ok !== 1) {
		// log/throw
	}
	return { success: ok === 1, matchedDocuments: n, modifiedDocuments: nModified };
};

const filterUserInUserGroups = (userId) => {
	return { userIds: userId };
};

module.exports = { updateManyResultDAO2BO, filterUserInUserGroups };
