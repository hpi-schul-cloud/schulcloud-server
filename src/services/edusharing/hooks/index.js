const { Configuration } = require('@schul-cloud/commons');
const { authenticate } = require('@feathersjs/authentication');
const { disallow } = require('feathers-hooks-common');
const { NotFound } = require('@feathersjs/errors');

const isEdusharing = (context) => {
	if (Configuration.get('LERNSTORE_MODE') !== 'EDUSHARING') {
		throw new NotFound('This API is activated only for the lernstore mode Edusharing');
	}
	context.safeAttributes = ['url'];
	return Promise.resolve(context);
};

exports.before = {
	all: [authenticate('jwt'), isEdusharing],
	find: [],
	get: [],
	create: [disallow()],
	update: [disallow()],
	patch: [disallow()],
	remove: [disallow()],
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
