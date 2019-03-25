const service = require('feathers-mongoose');
const { FileModel } = require('./model');
const hooks = require('./hooks/model-hooks');
const EventMatcher = require('../../events/eventMatcher');

module.exports = function () {
	const app = this;

	const fileOptions = {
		Model: FileModel,
		paginate: {
			default: 10000,
			max: 10000
		},
		lean: true,
	};

	// Initialize our service with any options it requires
	app.use('/files', service(fileOptions));
	const fileModelService = app.service('files');
	fileModelService.before(hooks.before);
	fileModelService.after(hooks.after);

	fileModelService.on('created', (message, context) => { EventMatcher.emit('file','created', message, context); });
	fileModelService.on('updated', (message, context) => { EventMatcher.emit('file','created', message, context); });
	fileModelService.on('patched', (message, context) => { EventMatcher.emit('file','patched', message, context); });
	fileModelService.on('removed', (message, context) => { EventMatcher.emit('file','removed', message, context); });


	app.use('/directories', service(directoryOptions));
	const directoryModelService = app.service('directories');
	directoryModelService.before(hooks.before);
	directoryModelService.after(hooks.after);
};
