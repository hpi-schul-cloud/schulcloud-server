const feathersMongooseService = require('feathers-mongoose');
const { disallow } = require('feathers-hooks-common');
const { userModel } = require('../model');

const hooks = {
	before: {
		all: [],
		get: [disallow('external')],
		find: [disallow('external')],
		create: [disallow('external')],
		patch: [disallow('external')],
		update: [disallow()],
		remove: [disallow()],
	},
};

const path = '/usersModel';

const configure = (app) => {
	const options = {
		Model: userModel,
		paginate: {
			default: 1000,
			max: 5000,
		},
		lean: {
			virtuals: true,
		},
	};

	app.use(path, feathersMongooseService(options));
	const service = app.service(path);
	service.hooks(hooks);
};

module.exports = {
	configure,
	hooks,
	path,
};
