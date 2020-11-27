const Pseudonym = require('../../../../src/services/pseudonym/model');

let createdpseudonymsIds = [];

const createTestPseudonym = async (pseudonymParameters, ltiTool, user) => {
	pseudonymParameters.userId = user._id;
	pseudonymParameters.toolId = ltiTool._id;

	const pseudonym = await Pseudonym.create(pseudonymParameters);
	createdpseudonymsIds.push(pseudonym._id.toString());
	return pseudonym;
};

const cleanup = async () => {
	if (createdpseudonymsIds.length === 0) {
		return Promise.resolve();
	}
	const ids = createdpseudonymsIds;
	createdpseudonymsIds = [];
	return Pseudonym.deleteMany({ _id: { $in: ids } });
};

module.exports = {
	create: createTestPseudonym,
	cleanup,
	info: createdpseudonymsIds,
};
