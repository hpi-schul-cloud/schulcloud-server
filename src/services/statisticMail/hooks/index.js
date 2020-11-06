const hooks = require('feathers-hooks-common');
const { authenticate } = require('@feathersjs/authentication');
const { isSuperHero, ifNotLocal } = require('../../../hooks');

exports.before = {
	all: [ifNotLocal(authenticate('jwt', 'api-key')), ifNotLocal(isSuperHero())],
	find: [hooks.disallow()],
	get: [hooks.disallow()],
	create: [],
	update: [hooks.disallow()],
	patch: [hooks.disallow()],
	remove: [hooks.disallow()],
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
