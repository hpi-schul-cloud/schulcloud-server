const Ajv = require('ajv');
const service = require('feathers-mongoose');
const { authenticate } = require('@feathersjs/authentication');
const { iff, isProvider, validateSchema, disallow } = require('feathers-hooks-common');
const { datasourceModel } = require('../model');
const { updatedBy, createdBy, protectFields, validateParams } = require('../hooks');

const { restrictToCurrentSchool, hasPermission, denyIfNotCurrentSchool } = require('../../../hooks');
const { datasourcesCreateSchema, datasourcesPatchSchema } = require('../schemas');

/**
 * the datasources service manages the datasources collection.
 */
const datasourceService = service({
	Model: datasourceModel,
	paginate: {
		default: 10,
		max: 50,
	},
	multi: true,
	whitelist: [ '$exists', '$elemMatch', '$regex', '$skip', '$populate' ],
});

const datasourceHooks = {
	before: {
		all: [authenticate('jwt'), iff(isProvider('external'), [validateParams])],
		find: [iff(isProvider('external'), [restrictToCurrentSchool, hasPermission('DATASOURCES_VIEW')])],
		get: [iff(isProvider('external'), hasPermission('DATASOURCES_VIEW'))],
		create: [
			iff(isProvider('external'), [
				restrictToCurrentSchool,
				hasPermission('DATASOURCES_CREATE'),
				validateSchema(datasourcesCreateSchema, Ajv),
				createdBy,
			]),
		],
		update: [disallow()],
		patch: [
			iff(isProvider('external'), [
				restrictToCurrentSchool,
				hasPermission('DATASOURCES_EDIT'),
				validateSchema(datasourcesPatchSchema, Ajv),
				updatedBy,
			]),
		],
		remove: [iff(isProvider('external'), [restrictToCurrentSchool, hasPermission('DATASOURCES_DELETE')])],
	},
	after: {
		all: [iff(isProvider('external'), protectFields)],
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
