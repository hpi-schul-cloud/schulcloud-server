const service = require('feathers-mongoose');
const fs = require('fs');
const jwt = require('jsonwebtoken');

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

	app.use('/tools/sign', {
		create(data) {
			return new Promise((resolve) => resolve(
				jwt.sign(data.request, fs.readFileSync('private_key.pem'), { algorithm: 'RS256' })
			));
		},
	});
};
