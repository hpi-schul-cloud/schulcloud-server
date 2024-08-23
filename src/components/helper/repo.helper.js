const { error } = require('../../logger');

/**
 * https://mongoosejs.com/docs/6.x/docs/migrating_to_6.html#mongodb-driver-40
 * Converts an mongoose update many result to an internal TO
 * @param {Integer} matchedCount; // Number of documents matched
 * @param {Integer} modifiedCount; // Number of documents modified
 * @param {Boolean} acknowledged; // Boolean indicating everything went smoothly.
 * @param {null|string} upsertedId; // null or an id containing a document that had to be upserted.
 * @param {Integer} upsertedCount; // Number indicating how many documents had to be upserted. Will either be 0 or 1.
 */
const updateManyResult = ({ acknowledged, matchedCount, modifiedCount }) => {
	if (!acknowledged) {
		error('mongoose updateMany has failed', { acknowledged, matchedCount, modifiedCount });
	}
	return { success: acknowledged, modifiedDocuments: modifiedCount };
};

/**
 * https://mongoosejs.com/docs/6.x/docs/migrating_to_6.html#mongodb-driver-40
 * Converts an mongoose delete many result to an internal TO
 * @param {Boolean} acknowledged; // Boolean indicating everything went smoothly.
 * @param {Integer} deletedCount Number of elements deleted
 */
const deleteManyResult = ({ acknowledged, deletedCount }) => {
	if (!acknowledged) {
		error('mongoose deleteMany has failed', { acknowledged, deletedCount });
	}
	return { success: acknowledged, deletedDocuments: deletedCount };
};
module.exports = { updateManyResult, deleteManyResult };
