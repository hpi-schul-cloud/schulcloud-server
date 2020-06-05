const hooks = require('feathers-hooks-common');
const { authenticate } = require('@feathersjs/authentication');
const { isSuperHero } = require('../../../hooks');


exports.before = {
	all: [
		authenticate('jwt'),
		isSuperHero(),
	],
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
