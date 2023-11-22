const { error } = require('../../logger');

/**
 * TODO Check this https://mongoosejs.com/docs/6.x/docs/api/query.html#query_Query-updateMany
 * the given example references nModified, so why must we change it to modifiedCount?
 *
 *
 * * Converts an mongoose update many result to an internal TO
 * @param {*} param0
 * @param {1|0} param0.ok 0 for error
 * @param {Integer} param0.n Number of elements matched the given filter
 * @param {Integer} param0.modifiedCount Number of elements updated
 */
const updateManyResult = ({ ok, n, modifiedCount }) => {
	if (ok !== 1) {
		error('mongoose updateMany has failed', { ok, n, modifiedCount });
	}
	return { success: ok === 1, modifiedDocuments: modifiedCount };
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
