import { PseudonymModel } from '../../../../src/components/pseudonym/repo/db/pseudonym.ts';

let createdpseudonymsIds = [];

const createTestPseudonym = async (pseudonymParameters, ltiTool, user) => {
	pseudonymParameters.userId = user._id;
	pseudonymParameters.toolId = ltiTool._id;

	const pseudonym = await PseudonymModel.create(pseudonymParameters);
	createdpseudonymsIds.push(pseudonym._id.toString());
	return pseudonym;
};

const cleanup = async () => {
	if (createdpseudonymsIds.length === 0) {
		return Promise.resolve();
	}
	const ids = createdpseudonymsIds;
	createdpseudonymsIds = [];
	return PseudonymModel.deleteMany({ _id: { $in: ids } });
};

module.exports = {
	create: createTestPseudonym,
	cleanup,
	info: createdpseudonymsIds,
};
