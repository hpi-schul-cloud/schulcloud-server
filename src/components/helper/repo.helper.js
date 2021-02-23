const { error } = require('../../logger');

/**
 * Converts an mongoose update many result to an internal TO
 * @param {*} param0
 * @param {1|0} param0.ok 0 for error
 * @param {Integer} param0.n Number of elements matched the given filter
 * @param {Integer} param0.nModified Number of elements updated
 */
const updateManyResult = ({ ok, n, nModified }) => {
	if (ok !== 1) {
		error('mongoose updateMany has failed', { ok, n, nModified });
	}
	return { success: ok === 1, modifiedDocuments: nModified };
};

/**
 * Converts an mongoose delete many result to an internal TO
 * @param {*} param0
 * @param {1|0} param0.ok 0 for error
 * @param {Integer} param0.n Number of elements matched the given filter
 * @param {Integer} param0.deletedCount Number of elements deleted
 */
const deleteManyResult = ({ ok, n, deletedCount }) => {
	if (ok !== 1) {
		error('mongoose deleteMany has failed', { ok, n, deletedCount });
	}
	return { success: ok === 1, deletedDocuments: deletedCount };
};
module.exports = { updateManyResult, deleteManyResult };
