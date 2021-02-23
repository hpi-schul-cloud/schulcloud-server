const { authenticate } = require('@feathersjs/authentication');
const { preparePagination, deleteNewsHistory } = require('./news.hooks');
const { lookupSchool } = require('../../../hooks');

exports.before = {
	all: [authenticate('jwt'), lookupSchool],
	find: [preparePagination],
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
	remove: [deleteNewsHistory],
};
