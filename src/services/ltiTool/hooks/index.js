'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

exports.before = {
  all: [auth.hooks.authenticate('jwt')],
  find: [globalHooks.hasPermission('TOOL_VIEW')],
  get: [globalHooks.hasPermission('TOOL_VIEW')],
  create: [globalHooks.hasPermission('TOOL_CREATE')],
  update: [globalHooks.hasPermission('TOOL_EDIT')],
  patch: [globalHooks.hasPermission('TOOL_EDIT')],
  remove: [globalHooks.hasPermission('TOOL_CREATE')]
};

const replacePseudonym = (hook) => {
	let userId = hook.params.account.userId;
	let pseudoService = hook.app.service('pseudonym');
	if (Array.isArray(hook.result)) { // FIND
		for (let tool in hook.result) {
			// TODO: replace placeholder
		}
		return hook;
	} else { // GET
		let toolId = hook.result._id

		return pseudoService.find({
			query: {
				userId: userId,
				toolId: toolId
			}
		}).then((pseudonym) => {
			hook.result.pseudonymizedUrl = hook.result.url.replace('{PSEUDONYM}', pseudonym.data[0].token);
			return hook;
		});
	}
}

exports.after = {
  all: [],
  find: [],
  get: [replacePseudonym],
  create: [],
  update: [],
  patch: [],
  remove: []
};
