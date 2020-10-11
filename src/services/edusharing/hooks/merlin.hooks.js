const { authenticate } = require('@feathersjs/authentication');
const { disallow } = require('feathers-hooks-common');
const { NotFound } = require('@feathersjs/errors');
const { Configuration } = require('@schul-cloud/commons');

const checkMerlinConfiguration = (hook) => {
	if (!Configuration.get('ES_MERLIN_ENABLED')) {
		throw new Error('Merlin is not enabled');
	}
};

const validateReference = (hook) => {
	if (!hook || !hook.params || !hook.params.query || !hook.params.query.merlinReference) {
		throw new NotFound(`Missing query params: {merlinReference: fooBar}`);
	}
	return hook;
};

exports.before = {
	all: [authenticate('jwt'), checkMerlinConfiguration],
	find: [validateReference],
	get: [disallow()],
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
