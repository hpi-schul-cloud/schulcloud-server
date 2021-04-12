const { authenticate } = require('@feathersjs/authentication');
const { disallow, iffElse, isProvider } = require('feathers-hooks-common');
const { hasPermission, populateCurrentSchool } = require('../../../hooks');
const restrictToSchoolSystems = require('./restrictToSchoolSystems');

exports.before = {
	all: [],
	find: [disallow()],
	get: [
		iffElse(
			isProvider('external'),
			[authenticate('jwt'), hasPermission('SYSTEM_EDIT'), populateCurrentSchool, restrictToSchoolSystems],
			[disallow()]
		),
	],
	create: [disallow()],
	update: [disallow()],
	patch: [authenticate('jwt'), hasPermission('SCHOOL_EDIT')],
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
