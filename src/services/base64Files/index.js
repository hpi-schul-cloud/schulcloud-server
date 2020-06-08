const service = require('feathers-mongoose');
const hooks = require('./hooks');
const { base64FileModel } = require('./models');

module.exports = (app) => {
	const base64FileService = service({
		Model: base64FileModel,
		paginate: {
			default: 5,
			max: 25,
		},
		lean: true,
	});

	const name = 'base64Files';
	app.use(name, base64FileService);
	const base64Files = app.service(name);
	base64Files.hooks(hooks);
};
