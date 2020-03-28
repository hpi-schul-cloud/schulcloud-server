const service = require('feathers-mongoose');
const StorageProvider = require('./model');
const hooks = require('./hooks');

module.exports = function storageProviderService() {
	const app = this;
	const options = {
		Model: StorageProvider,
		paginate: {
			default: 1000,
			max: 1000,
		},
		lean: false,
	};

	app.use('/storageProvider', service(options));

	const storageProviderService = app.service('/storageProvider');
	storageProviderService.hooks(hooks);
};
