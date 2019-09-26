const { disallow } = require('feathers-hooks-common');
const { authenticate } = require('@feathersjs/authentication');
const { lookupSchool } = require('./news.hooks');

exports.before = {
	all: [],
	find: [
		authenticate('jwt'),
		lookupSchool,
	],
	get: [disallow()],
	create: [disallow()],
	update: [disallow()],
	patch: [disallow()],
	remove: [disallow()],
};
