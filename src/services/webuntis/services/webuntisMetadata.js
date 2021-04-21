const service = require('feathers-mongoose');
// const Ajv = require('ajv');
const auth = require('@feathersjs/authentication');
const { iff, isProvider, /* validateSchema, */ disallow } = require('feathers-hooks-common');
const { hasPermission } = require('../../../hooks');
const { requireDatasourceId } = require('../hooks');
// const { createSchema, patchSchema } = require('../schemas');
const { webuntisMetadataModel } = require('../model');
const { defaultWhitelist } = require('../../../utils/whitelist');

/**
 * the datasources service manages the datasources collection.
 */
const webuntisMetadataService = service({
	Model: webuntisMetadataModel,
	paginate: {
		default: 50,
		max: 1000,
	},
	multi: true,
	whitelist: defaultWhitelist,
});

/**
 * hooks should be used for validation and authorisation, and very simple logic.
 * If your service requires more complicated logic, implement a custom service.
 * use disallow() to disable any methods that are not supposed to be used.
 * more hooks can be found at https://feathers-plus.github.io/v1/feathers-hooks-common/index.html#Hooks.
 */
const webuntisMetadataServiceHooks = {
	before: {
		all: [auth.hooks.authenticate('jwt')],
		find: [iff(isProvider('external'), [hasPermission('DATASOURCES_VIEW'), requireDatasourceId])],
		get: [iff(isProvider('external'), disallow())],
		create: [iff(isProvider('external'), [disallow()])],
		update: [disallow()],
		patch: [iff(isProvider('external'), disallow())],
		remove: [iff(isProvider('external'), [disallow()])],
	},
	after: {
		all: [],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: [],
	},
};

module.exports = { webuntisMetadataService, webuntisMetadataServiceHooks };
