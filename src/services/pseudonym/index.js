const service = require('feathers-mongoose');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const Pseudonym = require('./model');
const hooks = require('./hooks');
const { defaultWhitelist } = require('../../utils/whitelist');

module.exports = function () {
	const app = this;
	const options = {
		Model: Pseudonym,
		paginate: {
			default: 1000,
			max: 1000,
		},
		lean: false,
		multi: true,
		whitelist: defaultWhitelist,
	};
	app.use('/pseudonym/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));
	app.use('/pseudonym', service(options));

	const pseudonymService = app.service('/pseudonym');
	pseudonymService.hooks(hooks);
};
