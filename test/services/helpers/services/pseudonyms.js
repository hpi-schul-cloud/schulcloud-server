let createdpseudonymsIds = [];

// should rewrite
const createTestPseudonym = (appPromise) => async (pseudonymParameters, ltiTool, user) => {
	const app = await appPromise;
	pseudonymParameters.userId = user._id;
	pseudonymParameters.toolId = ltiTool._id;
	return app
		.service('pseudonymModel')
		.create(pseudonymParameters)
		.then((pseudonym) => {
			createdpseudonymsIds.push(pseudonym._id.toString());
			return pseudonym;
		});
};

const cleanup = (appPromise) => async () => {
	const app = await appPromise;
	if (createdpseudonymsIds.length === 0) {
		return Promise.resolve();
	}
	const ids = createdpseudonymsIds;
	createdpseudonymsIds = [];
	return ids.map((id) => app.service('pseudonymModel').remove(id));
};

module.exports = (app, opt) => ({
	create: createTestPseudonym(app, opt),
	cleanup: cleanup(app),
	info: createdpseudonymsIds,
});
