const { authenticate } = require('@feathersjs/authentication');
const { disallow } = require('feathers-hooks-common');
const { NotFound } = require('@feathersjs/errors');

const validateReference = (hook) => {
	if (!hook || !hook.params || !hook.params.query || !hook.params.query.merlinReference) {
		throw new NotFound(`Missing query params: {merlinReference: fooBar}`);
	}
	return hook;
};

exports.before = {
	all: [authenticate('jwt')],
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
