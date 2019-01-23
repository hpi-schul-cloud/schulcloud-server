const auth = require('feathers-authentication');
const { Forbidden } = require('feathers-errors');

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
