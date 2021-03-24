const service = require('feathers-mongoose');
const { FileModel } = require('./model');
const hooks = require('./hooks/model-hooks');

module.exports = (app) => {
	const fileOptions = {
		Model: FileModel,
		paginate: {
			default: 10000,
			max: 10000,
		},
		lean: true,
		multi: true,
		whitelist: ['$exists', '$elemMatch', '$regex', '$skip', '$populate'],
	};

	// Initialize our service with any options it requires
	app.use('/files', service(fileOptions));
	const fileModelService = app.service('files');
	fileModelService.hooks(hooks);
};
