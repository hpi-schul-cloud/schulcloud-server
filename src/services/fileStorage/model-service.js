'use strict';

const service = require('feathers-mongoose');
const fileModel = require('./model').fileModel;
const directoryModel = require('./model').directoryModel;
const hooks = require('./hooks/model-hooks');
const swaggerDocs = require('./docs');

module.exports = function () {
	const app = this;

	const fileOptions = {
		Model: fileModel,
		paginate: {
			default: 10000,
			max: 10000
		},
		lean: true
	};

	const directoryOptions = {
		Model: directoryModel,
		paginate: {
			default: 10000,
			max: 10000
		},
		lean: true
	};

	// Initialize our service with any options it requires
	var fileService = service(fileOptions);
	fileService.docs = swaggerDocs.fileService;

	var directoryService = service(directoryOptions);
	directoryService.docs = swaggerDocs.directoriesService;

	app.use('/files', fileService);
	const fileModelService = app.service('files');
	fileModelService.before(hooks.before);
	fileModelService.after(hooks.after);

	app.use('/directories', directoryService);
	const directoryModelService = app.service('directories');
	directoryModelService.before(hooks.before);
	directoryModelService.after(hooks.after);
};
