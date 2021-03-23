const service = require('feathers-mongoose');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const { StorageProviderModel } = require('./model');
const hooks = require('./hooks');

module.exports = (app) => {
	const options = {
		Model: StorageProviderModel,
		paginate: {
			default: 150,
			max: 1000,
		},
		lean: true,
		multi: true,
		whitelist: [ '$exists', '$elemMatch', '$regex', '$skip', '$populate' ],
	};

	app.use('/storageProvider/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));
	app.use('/storageProvider', service(options));

	const storageProviderService = app.service('/storageProvider');
	storageProviderService.hooks(hooks);
};
