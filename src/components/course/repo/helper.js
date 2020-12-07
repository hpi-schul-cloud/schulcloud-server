const updateManyResult = ({ n, nModified, ok }) => {
	// todo is ok === 0 possible or does it throw?
	if (ok !== 1) {
		// log/throw
	}
	return { success: ok === 1, matchedDocuments: n, modifiedDocuments: nModified };
};

module.exports = { updateManyResult };
