/**
 * Converts an mongoose update many result to an internal TO
 * @param {*} param0
 * @param {1|0} param0.ok 0 for error
 * @param {Integer} param0.n Number of elements matched the given filter
 * @param {Integer} param0.nModified Number of elements updated
 */
const updateManyResult = ({ ok, n, nModified }) => {
	if (ok !== 1) {
		// TODO warn/throw
	}
	return { success: ok === 1, modifiedDocuments: nModified };
};
module.exports = { updateManyResult };
