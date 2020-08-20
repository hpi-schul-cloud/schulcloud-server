const { Configuration } = require('@schul-cloud/commons');
const { authenticate } = require('@feathersjs/authentication');
const { disallow } = require('feathers-hooks-common');
const { NotFound } = require('@feathersjs/errors');
const { hasPermission } = require('../../../hooks');

const isEdusharing = (context) => {
	if (Configuration.get('LERNSTORE_MODE') !== 'EDUSHARING') {
		throw new NotFound('This API is activated only for the lernstore mode Edusharing');
	}
	context.safeAttributes = ['url'];
	return Promise.resolve(context);
};

exports.before = {
	all: [authenticate('jwt'), isEdusharing],
	find: [hasPermission('LERNSTORE_VIEW')],
	get: [hasPermission('LERNSTORE_VIEW')],
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
