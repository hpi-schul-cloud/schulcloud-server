let createdltiToolsIds = [];

// should rewrite
const createTestLtiTool = (appPromise) => async ({
	name = 'LTI Tools',
	url = 'http://lti.tools/test/tp.php',
	key = 'jisc.ac.uk',
	secret = 'secret',
	logo_url = '',
	lti_message_type = 'basic-lti-launch-request',
	lti_version = 'LTI-1p0',
	resource_link_id = '0',
	isTemplate = null,
	originTool = null,
} = {}) => {
	const app = await appPromise;
	return app
		.service('ltiTools')
		.create({
			name,
			url,
			key,
			secret,
			logo_url,
			lti_message_type,
			lti_version,
			resource_link_id,
			isTemplate,
			originTool,
		})
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
