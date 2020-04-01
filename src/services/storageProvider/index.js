const service = require('feathers-mongoose');
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

	const storageProviderService = app.service('/storageProvider');
	storageProviderService.hooks(hooks);
};
