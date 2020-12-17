const problemModel = require('../../../../src/services/helpdesk/model');

let createdproblemsIds = [];

const createTestProblem = async ({
	userId,
	type = 'contactAdmin',
	_id = '5836bb5664582c35df3bc214',
	subject = 'Dies ist ein Titel',
	currentState = 'Dies ist der CurrentState',
	targetState = 'Dies ist der TargetState',
	schoolId = '5836bb5664582c35df3bc000',
	...other
}) => {
	const problem = await problemModel.create({
		userId,
		type,
		_id,
		subject,
		currentState,
		targetState,
		schoolId,
		...other,
	});
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
