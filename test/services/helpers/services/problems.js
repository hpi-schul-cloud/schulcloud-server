const problemModel = require('../../../../src/services/helpdesk/model');

let createdproblemsIds = [];

const createTestProblem = async (problemParameters, user) => {
	problemParameters.userId = user._id;

	const problem = await problemModel.create(problemParameters);
	createdproblemsIds.push(problem._id.toString());
	return problem;
};

const cleanup = async () => {
	if (createdproblemsIds.length === 0) {
		return Promise.resolve();
	}
	const ids = createdproblemsIds;
	createdproblemsIds = [];
	return problemModel.deleteMany({ _id: { $in: ids } });
};

module.exports = {
	create: createTestProblem,
	cleanup,
	info: createdproblemsIds,
};
