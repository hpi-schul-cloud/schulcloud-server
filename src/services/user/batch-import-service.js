'use strict';

const service = require('feathers-mongoose');
const user = require('./model');
const hooks = require('./hooks');

class BatchImportService {

	create(data, params) {
		return Promise.resolve(data);
	}
}

module.exports = function () {
	const app = this;

	// Initialize our service with any options it requires
	app.use('/csv/import', new BatchImportService());

	// Get our initialize service to that we can bind hooks
	const batchImportService = app.service('/csv/import');

	// Set up our before hooks
	batchImportService.before(hooks.before);

	// Set up our after hooks
	batchImportService.after(hooks.after);
};