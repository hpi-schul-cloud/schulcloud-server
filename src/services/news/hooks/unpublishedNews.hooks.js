const { disallow } = require('feathers-hooks-common');
const auth = require('@feathersjs/authentication');
const { lookupSchool } = require('./news.hooks');

exports.before = {
	all: [],
	find: [
		auth.hooks.authenticate('jwt'),
		lookupSchool,
	],
	get: [disallow()],
	create: [disallow()],
	update: [disallow()],
	patch: [disallow()],
	remove: [disallow()],
};
