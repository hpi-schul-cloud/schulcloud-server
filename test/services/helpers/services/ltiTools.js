let createdltiToolsIds = [];

const defaultParams = {
	name: 'LTI Tools',
	url: 'http://lti.tools/test/tp.php',
	key: 'jisc.ac.uk',
	secret: 'secret',
	logo_url: '',
	lti_message_type: 'basic-lti-launch-request',
	lti_version: 'LTI-1p0',
	resource_link_id: '0',
};
// should rewrite
const createTestLtiTool = (appPromise) => async (ltiToolParameters = defaultParams) => {
	const app = await appPromise;
	return app
		.service('ltiTools')
		.create(ltiToolParameters)
		.then((ltiTool) => {
			createdltiToolsIds.push(ltiTool._id.toString());
			return ltiTool;
		});
};

const cleanup = (appPromise) => async () => {
	const app = await appPromise;
	if (createdltiToolsIds.length === 0) {
		return Promise.resolve();
	}
	const ids = createdltiToolsIds;
	createdltiToolsIds = [];
	return ids.map((id) => app.service('ltiTools').remove(id));
};

module.exports = (app, opt) => ({
	create: createTestLtiTool(app, opt),
	cleanup: cleanup(app),
	info: createdltiToolsIds,
});
