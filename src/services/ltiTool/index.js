const service = require('feathers-mongoose');
const oauth = require('oauth-sign');

const ltiTool = require('./model');
const hooks = require('./hooks');

module.exports = function () {
	const app = this;

	const options = {
		Model: ltiTool,
		paginate: {
			default: 100,
			max: 100,
		},
		lean: true,
	};

	app.use('/ltiTools', service(options));
	const ltiToolService = app.service('/ltiTools');
	ltiToolService.hooks(hooks);

	app.use('/tools/sign/lti11/', {
		create(data) {
			return app.service('/ltiTools')
				.get(data.id)
				.then((tool) => oauth.hmacsign('POST', data.url, data.payload, tool.secret));
		},
	});
};
