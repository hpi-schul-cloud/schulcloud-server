const service = require('feathers-mongoose');
const auth = require('@feathersjs/authentication');
const {
	iff, isProvider, validateSchema, disallow,
} = require('feathers-hooks-common');
const { datasourceModel } = require('../model');
const { validateData, updatedBy, createdBy } = require('../hooks');

const { restrictToCurrentSchool, hasPermission, denyIfNotCurrentSchool } = require('../../../hooks');

/**
 * the datasources service manages the datasources collection.
 */
const datasourceService = service({
	Model: datasourceModel,
	paginate: {
		default: 10,
		max: 50,
	},
});

const datasourceHooks = {
	before: {
		all: [
			auth.hooks.authenticate('jwt'),
		],
		find: [
			iff(isProvider('external'), [
				restrictToCurrentSchool,
				hasPermission('DATASOURCES_VIEW'),
			]),
		],
		get: [iff(isProvider('external'), hasPermission('DATASOURCES_VIEW'))],
		create: [
			iff(isProvider('external'), [
				hasPermission('DATASOURCES_CREATE'),
				restrictToCurrentSchool,
				validateData,
				createdBy,
			]),
		],
		update: [disallow()],
		patch: [
			iff(isProvider('external'), [
				restrictToCurrentSchool,
				hasPermission('DATASOURCES_EDIT'),
				validateData,
				updatedBy,
			]),
		],
		remove: [
			iff(isProvider('external'), [
				restrictToCurrentSchool,
				hasPermission('DATASOURCES_DELETE'),
			]),
		],
	},
	after: {
		all: [],
		find: [],
		get: [
			iff(isProvider('external'), [
				denyIfNotCurrentSchool({
					errorMessage: 'You do not have valid permissions to access this.',
				}),
			]),
		],
		create: [],
		update: [],
		patch: [],
		remove: [],
	},
};

module.exports = { datasourceService, datasourceHooks };
