const auth = require('@feathersjs/authentication');
const { lookupSchool, preparePagination, deleteNewsHistory } = require('./news.hooks');

exports.before = {
	all: [
		auth.hooks.authenticate('jwt'),
		lookupSchool,
	],
	find: [
		preparePagination,
	],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [
		deleteNewsHistory,
	],
};
