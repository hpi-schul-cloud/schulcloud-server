const Pseudonym = require('../../../services/pseudonym/model');
const { deleteManyResult } = require('../../helper/repo.helper');
const { validateObjectId } = require('../../helper/uc.helper');

/**
 * Return pseudonyms for userId
 * @param userId
 */
const getPseudonymsForUser = async (userId) => {
	validateObjectId(userId);
	return Pseudonym.find({ userId }).lean().exec();
};

/**
 * Removes all pseudonyms for userId
 * @param {String|ObjectId} userId
 */
const deletePseudonymsForUser = async (userId) => {
	validateObjectId(userId);
	const deleteResult = await Pseudonym.deleteMany({ userId }).lean().exec();
	return deleteManyResult(deleteResult);
};

module.exports = {
	getPseudonymsForUser,
	deletePseudonymsForUser,
};
