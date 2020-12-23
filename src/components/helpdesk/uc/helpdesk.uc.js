const { problemRepo } = require('../repo/index');
const { validateObjectId } = require('../../helper/uc.helper');
const { debug } = require('../../../logger');

const deleteProblemsForUser = async (userId) => {
	validateObjectId(userId);
	let complete = true;
	const problems = await problemRepo.getProblemsForUser(userId);
	debug(`found ${problems.length} helpdesk problems for the user to be removed`, { userId });
	if (problems.length !== 0) {
		const result = await problemRepo.deleteProblemsForUser(userId);
		complete = result.success;
		debug(`removed  ${result.deletedDocuments} helpdesk problems`, { userId });
	}
	debug(`deleting user related helpdesk problems started`, { userId });
	return { trashBinData: { scope: 'problems', data: problems }, complete };
};

const deleteUserData = () => [deleteProblemsForUser];

module.exports = {
	deleteUserData,
};
