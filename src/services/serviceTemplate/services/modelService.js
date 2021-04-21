const service = require('feathers-mongoose');
const Ajv = require('ajv');
const auth = require('@feathersjs/authentication');
const { iff, isProvider, validateSchema, disallow } = require('feathers-hooks-common');
const { customHook } = require('../hooks');
const { hasPermission } = require('../../../hooks');

const { createSchema, patchSchema } = require('../schemas');
const { serviceModel } = require('../model');
const { defaultModelServiceWhitelist } = require('../../../utils/whitelist');

/**
 * the datasources service manages the datasources collection.
 */
const modelService = service({
	Model: serviceModel,
	paginate: {
		default: 25,
		max: 100,
	},
	multi: true,
	whitelist: defaultModelServiceWhitelist,
});

/**
 * hooks should be used for validation and authorisation, and very simple logic.
 * If your service requires more complicated logic, implement a custom service.
 * use disallow() to disable any methods that are not supposed to be used.
 * more hooks can be found at https://feathers-plus.github.io/v1/feathers-hooks-common/index.html#Hooks.
 */
const modelServiceHooks = {
	before: {
		all: [auth.hooks.authenticate('jwt')],
		find: [iff(isProvider('external'), hasPermission('SERVICE_TEMPLATE_VIEW'))],
		get: [iff(isProvider('external'), hasPermission('SERVICE_TEMPLATE_VIEW'))],
		create: [
			iff(isProvider('external'), [validateSchema(createSchema, Ajv), hasPermission('SERVICE_TEMPLATE_CREATE')]),
		],
		update: [disallow()],
		patch: [
			customHook,
			iff(isProvider('external'), [validateSchema(patchSchema, Ajv), hasPermission('SERVICE_TEMPLATE_EDIT')]),
		],
		remove: [iff(isProvider('external'), [hasPermission('SERVICE_TEMPLATE_REMOVE')])],
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

module.exports = { modelService, modelServiceHooks };
