const { authenticate } = require('@feathersjs/authentication');
const _ = require('lodash');
const globalHooks = require('../../../hooks');

const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);

exports.before = {
	all: [authenticate('jwt')],
	find: [globalHooks.hasPermission('COURSE_VIEW'), restrictToCurrentSchool],
	get: [globalHooks.hasPermission('COURSE_VIEW')], // school is checked in afterhook
	create: [globalHooks.hasPermission('COURSEGROUP_CREATE')],
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
	get: [
		globalHooks.ifNotLocal(
			globalHooks.denyIfNotCurrentSchool({
				errorMessage: 'Die angefragte Gruppe gehört nicht zur eigenen Schule!',
			}),
		),
	],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
