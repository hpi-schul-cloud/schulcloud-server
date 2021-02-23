const { authenticate } = require('@feathersjs/authentication');
const { disallow } = require('feathers-hooks-common');
const { hasPermission, ifNotLocal } = require('../../../hooks');

module.exports = {
	before: {
		all: [ifNotLocal(authenticate('jwt'))],
		find: [ifNotLocal(hasPermission('VIEW_SCHOOL_GROUP'))],
		create: [ifNotLocal(hasPermission('CREATE_SCHOOL_GROUP'))],
		update: [disallow()],
		get: [ifNotLocal(hasPermission('VIEW_SCHOOL_GROUP'))],
		patch: [ifNotLocal(hasPermission('EDIT_SCHOOL_GROUP'))],
		remove: [disallow()],
	},
};
