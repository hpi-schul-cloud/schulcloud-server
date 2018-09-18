'use strict';

const service = require('feathers-mongoose');
const fileModel = require('./model').fileModel;
const directoryModel = require('./model').directoryModel;
const hooks = require('./hooks/model-hooks');

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
	app.use('/files', service(fileOptions));
	const fileModelService = app.service('files');
	fileModelService.hooks({
		before: hooks.before,
		after: hooks.after
	});

	app.use('/directories', service(directoryOptions));
	const directoryModelService = app.service('directories');
	directoryModelService.hooks({
		before: hooks.before,
		after: hooks.after
	});
};
