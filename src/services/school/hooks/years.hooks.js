const { authenticate } = require('@feathersjs/authentication');
const { iff, isProvider } = require('feathers-hooks-common');
const { hasPermission } = require('../../../hooks');

module.exports = {
	before: {
		all: [iff(isProvider('external'), [authenticate('jwt')])],
		get: [],
		find: [],
		create: [iff(isProvider('external'), hasPermission('YEARS_EDIT'))],
		update: [iff(isProvider('external'), hasPermission('YEARS_EDIT'))],
		patch: [iff(isProvider('external'), hasPermission('YEARS_EDIT'))],
		remove: [iff(isProvider('external'), hasPermission('YEARS_EDIT'))],
	},
};
