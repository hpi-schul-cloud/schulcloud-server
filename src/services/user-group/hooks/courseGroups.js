const { authenticate } = require('@feathersjs/authentication');
const _ = require('lodash');
const globalHooks = require('../../../hooks');

const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);

exports.before = {
	all: [authenticate('jwt')],
	find: [globalHooks.hasPermission('COURSE_VIEW'), restrictToCurrentSchool],
	get: [globalHooks.hasPermission('COURSE_VIEW'), restrictToCurrentSchool],
	create: [globalHooks.hasPermission('COURSEGROUP_CREATE'), restrictToCurrentSchool],
	update: [globalHooks.hasPermission('COURSEGROUP_EDIT'), restrictToCurrentSchool],
	patch: [globalHooks.hasPermission('COURSEGROUP_EDIT'), restrictToCurrentSchool, globalHooks.permitGroupOperation],
	remove: [
		globalHooks.hasPermission('COURSEGROUP_CREATE'),
		restrictToCurrentSchool,
		globalHooks.permitGroupOperation,
	],
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
