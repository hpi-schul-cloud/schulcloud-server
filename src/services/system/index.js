const service = require('feathers-mongoose');
const system = require('./model');
const hooks = require('./hooks');

module.exports = function () {
	const app = this;

	const options = {
		Model: system,
		paginate: {
			default: 5,
			max: 25,
		},
		lean: true,
	};

	app.use('/systems', service(options));
	const systemService = app.service('/systems');
	systemService.hooks(hooks);
};
