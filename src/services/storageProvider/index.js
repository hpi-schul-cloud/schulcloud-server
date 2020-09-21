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
	};

	app.use('/storageProvider', service(options));
	app.use('/storageProvider/api', staticContent(path.join(__dirname, '/docs')));

	const storageProviderService = app.service('/storageProvider');
	storageProviderService.hooks(hooks);
};
