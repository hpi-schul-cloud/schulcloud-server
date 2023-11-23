const { error } = require('../../logger');

/**
 * https://mongoosejs.com/docs/6.x/docs/migrating_to_6.html#mongodb-driver-40
 * Converts an mongoose update many result to an internal TO
 * @param {*} param0
 * @param {1|0} param0.ok 0 for error
 * @param {Integer} param0.n Number of elements matched the given filter
 * @param {Integer} param0.nModified Number of elements updated
 */
const updateManyResult = ({ ok, n, modifiedCount }) => {
	if (ok !== 1) {
		error('mongoose updateMany has failed', { ok, n, modifiedCount });
	}
	return { success: ok === 1, modifiedDocuments: modifiedCount };
};

/**
 * https://mongoosejs.com/docs/6.x/docs/migrating_to_6.html#mongodb-driver-40
 * Converts an mongoose delete many result to an internal TO
 * @param {*} param0
 * @param {1|0} param0.ok 0 for error
 * @param {Integer} param0.n Number of elements matched the given filter
 * @param {Integer} param0.deletedCount Number of elements deleted
 */
const deleteManyResult = ({ acknowledged, deletedCount }) => {
	if (!acknowledged) {
		error('mongoose deleteMany has failed', { acknowledged, deletedCount });
	}
	return { success: acknowledged, deletedDocuments: deletedCount };
};
module.exports = { updateManyResult, deleteManyResult };
