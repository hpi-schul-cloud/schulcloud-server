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
	if (!hook.params.account) return hook;

	const { userId } = hook.params.account;
	const { _id, url } = hook.result;

	return hook.app.service('pseudonym').find({
		query: {
			userId: userId,
			toolId: _id
		}
	}).then(({data}) => {
		hook.result.pseudonymizedUrl = url.replace('{PSEUDONYM}', data[0].token);
		return hook;
	});
};

exports.after = {
  all: [],
  find: [],
  get: [replacePseudonym],
  create: [],
  update: [],
  patch: [],
  remove: []
};
