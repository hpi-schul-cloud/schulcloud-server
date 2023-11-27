const { Configuration } = require('@hpi-schul-cloud/commons');
const { authenticate } = require('@feathersjs/authentication');
const { disallow } = require('feathers-hooks-common');
const { hasPermission, hasSchoolPermission } = require('../../../hooks');
const { MethodNotAllowed } = require('@feathersjs/errors');

const isEdusharing = async (context) => {
	if (Configuration.get('FEATURE_LERNSTORE_ENABLED') !== true) {
		throw new MethodNotAllowed('This feature is disabled on this instance!');
	}
	context.safeAttributes = ['url'];
	return context;
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
