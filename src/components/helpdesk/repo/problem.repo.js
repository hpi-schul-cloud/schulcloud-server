const problemModel = require('../../../services/helpdesk/model');
const { GeneralError } = require('../../../errors');

const getProblemsForUser = async (userId) => {
	return problemModel.find({ userId }).lean().exec();
};

const deleteProblems = async (problemIds) => {
	const deleteResult = await problemModel
		.deleteMany({
			_id: {
				$in: problemIds,
			},
		})
		.lean()
		.exec();
	if (deleteResult.n !== deleteResult.ok || deleteResult.ok !== problemIds.length) {
		throw new GeneralError('db error during deleting problems');
	}
	return problemIds;
};

const deleteProblemsForUser = async (userId) => {
	const problems = await getProblemsForUser(userId);
	const problemIds = problems.map((problem) => problem._id);
	await deleteProblems(problemIds);
	return problems;
};

module.exports = {
	getProblemsForUser,
	deleteProblems,
	deleteProblemsForUser,
};
