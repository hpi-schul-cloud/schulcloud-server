const problemModel = require('../../../services/helpdesk/model');
const { deleteManyResult } = require('../../helper/repo.helper');
const { validateObjectId } = require('../../helper/uc.helper');

/**
 * Return helpdesk problems for userId
 * @param {String|ObjectId} userId
 */
const getProblemsForUser = async (userId) => {
	validateObjectId(userId);
	return problemModel.find({ userId }).lean().exec();
};

/**
 * Removes all helpdesk problems for userId
 * @param {String|ObjectId} userId
 */
const deleteProblemsForUser = async (userId) => {
	validateObjectId(userId);
	const deleteResult = await problemModel.deleteMany({ userId }).lean().exec();
	return deleteManyResult(deleteResult);
};

module.exports = {
	getProblemsForUser,
	deleteProblemsForUser,
};
