const auth = require('@feathersjs/authentication');
const { disallow } = require('feathers-hooks-common');
const globalHooks = require('../../../hooks');

const { lookupSchool } = require('../../news/hooks/news.hooks.js');

exports.before = {
	all: [auth.hooks.authenticate('jwt'), lookupSchool],
	find: [globalHooks.hasPermission('INSIGHTS_VIEW')],
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
