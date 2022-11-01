const { Configuration } = require('@hpi-schul-cloud/commons');
const { authenticate } = require('@feathersjs/authentication');
const { disallow } = require('feathers-hooks-common');
const { hasPermission, hasSchoolPermission } = require('../../../hooks');
const { NotFound } = require('@feathersjs/errors');

const isEdusharing = (context) => {
	if (Configuration.get('FEATURE_LERNSTORE_ENABLED') !== true) {
		throw new NotFound('This feature is disabled.');
	}
	context.safeAttributes = ['url'];
	return Promise.resolve(context);
};

exports.before = {
	all: [authenticate('jwt'), isEdusharing],
	get: [hasPermission('LERNSTORE_VIEW'), hasSchoolPermission('LERNSTORE_VIEW')],
	find: [disallow()],
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
