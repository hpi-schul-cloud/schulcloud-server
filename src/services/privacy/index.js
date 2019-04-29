const service = require('feathers-mongoose');
const privacyModel = require('./privacy-model');
const hooks = require('./hooks/index');

// eslint-disable-next-line func-names
module.exports = function () {
	const app = this;

	const options = {
		Model: privacyModel,
		paginate: {
			default: 100,
			max: 100,
		},
		lean: true,
	};

	app.use('/privacy', service(options));

	const privacyService = app.service('/privacy');

	privacyService.hooks(hooks);
};
