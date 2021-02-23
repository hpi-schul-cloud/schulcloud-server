const { authenticate } = require('@feathersjs/authentication');
const { disallow } = require('feathers-hooks-common');
const { ifNotLocal, restrictToCurrentSchool, hasPermission } = require('../../../hooks');
const lookupSchool = require('./lookupSchool');

module.exports = {
	before: {
		all: [ifNotLocal(authenticate('jwt')), ifNotLocal(restrictToCurrentSchool), lookupSchool],
		find: [],
		create: [ifNotLocal(hasPermission('SCHOOL_EDIT'))],
		update: [disallow()],
		get: [disallow()],
		patch: [disallow()],
		remove: [disallow()],
	},
};
