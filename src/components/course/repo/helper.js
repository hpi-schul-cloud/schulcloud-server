const updateManyResult = ({ n, nModified, ok }) => {
	return { success: ok === 1, matchedDocuments: n, modifiedDocuments: nModified };
};

module.exports = { updateManyResult };
