const { problemRepo } = require('../repo/index');

const deleteProblemsForUser = async (userId) => {
	return { complete: true, data: problemRepo.deleteProblemsForUser(userId) };
};

module.exports = {
	deleteProblemsForUser,
};
