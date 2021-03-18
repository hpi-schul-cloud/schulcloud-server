const service = require('feathers-mongoose');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const hooks = require('./hooks');
const { base64FileModel } = require('./models');
const seDownloadHeaders = require('./hooks/setDownloadHeaders');

module.exports = (app) => {
	const base64FileService = service({
		Model: base64FileModel,
		paginate: {
			default: 5,
			max: 25,
		},
		lean: true,
		multi: true,
	});

	const name = 'base64Files';
	app.use(`/${name}/api`, staticContent(path.join(__dirname, '/docs/openapi.yaml')));
	app.use(name, base64FileService, seDownloadHeaders);
	const base64Files = app.service(name);
	base64Files.hooks(hooks);
};
