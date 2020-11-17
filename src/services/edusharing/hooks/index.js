const { Configuration } = require('@hpi-schul-cloud/commons');
const { authenticate } = require('@feathersjs/authentication');
const { disallow, iff } = require('feathers-hooks-common');
const { hasPermission, hasSchoolPermission } = require('../../../hooks');
const { isOAuth2, authenticateOAuth2 } = require('../../../hooks/authentication');
const reqlib = require('app-root-path').require;

const { NotFound } = reqlib('src/errors');

const isEdusharing = (context) => {
	if (Configuration.get('LERNSTORE_MODE') !== 'EDUSHARING') {
		throw new NotFound('This API is activated only for the lernstore mode Edusharing');
	}
	context.safeAttributes = ['url'];
	return Promise.resolve(context);
};

exports.before = {
	all: [iff(isOAuth2, authenticateOAuth2('edusharing')).else(authenticate('jwt')), isEdusharing],
	find: [hasPermission('LERNSTORE_VIEW'), hasSchoolPermission('LERNSTORE_VIEW')],
	get: [hasPermission('LERNSTORE_VIEW'), hasSchoolPermission('LERNSTORE_VIEW')],
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
