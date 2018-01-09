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
	let data = hook.result;

	return pseudoService.find({
		query: {
			userId: userId,
			toolId: data._id
		}
	}).then((pseudonym) => {
		data.pseudonymizedUrl = data.url.replace('{PSEUDONYM}', pseudonym.data[0].token);
		return hook;
	});
};

const replacePseudonym = (hook) => {
	let userId = hook.params.account.userId;
	let pseudoService = hook.app.service('pseudonym');
	let data = hook.result;

	return pseudoService.find({
		query: {
			userId: userId,
			toolId: data._id
		}
	}).then((pseudonym) => {
		data.pseudonymizedUrl = data.url.replace('{PSEUDONYM}', pseudonym.data[0].token);
		return hook;
	});
};

const replacePseudonym = (hook) => {
	let userId = hook.params.account.userId;
	let pseudoService = hook.app.service('pseudonym');
	let data = hook.result;

	return pseudoService.find({
		query: {
			userId: userId,
			toolId: data._id
		}
	}).then((pseudonym) => {
		data.pseudonymizedUrl = data.url.replace('{PSEUDONYM}', pseudonym.data[0].token);
		return hook;
	});
};

const replacePseudonym = (hook) => {
	let userId = hook.params.account.userId;
	let pseudoService = hook.app.service('pseudonym');
	let data = hook.result;

	return pseudoService.find({
		query: {
			userId: userId,
			toolId: data._id
		}
	}).then((pseudonym) => {
		data.pseudonymizedUrl = data.url.replace('{PSEUDONYM}', pseudonym.data[0].token);
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
