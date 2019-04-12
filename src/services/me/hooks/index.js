const auth = require('@feathersjs/authentication');
const { Forbidden } = require('@feathersjs/errors');

const blocked = (hook) => {
	throw Forbidden('Method is not allowed!');
};

exports.before = {
	all: [],
	find: [auth.hooks.authenticate('jwt')],
	get: [blocked],
	create: [blocked],
	update: [blocked],
	patch: [blocked],
	remove: [blocked],
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
