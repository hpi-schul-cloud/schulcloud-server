const service = require('feathers-mongoose');
const StorageProvider = require('./model');
const hooks = require('./hooks');

module.exports = function storageProvider() {
	const app = this;
	const options = {
		Model: StorageProvider,
		paginate: {
			default: 1000,
			max: 1000,
		},
		lean: true,
	};

	app.use('/storageProvider', service(options));

	const storageProviderService = app.service('/storageProvider');
	storageProviderService.hooks(hooks);
};
