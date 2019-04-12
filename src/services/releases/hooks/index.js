'use strict';

const globalHooks = require('../../../hooks');
const auth = require('@feathersjs/authentication').hooks;
const model = require('../release-model');
const service = require('../index');

exports.before = service => {
	return {
		all: [auth.authenticate('jwt')],
		find: [globalHooks.hasPermission('RELEASES_VIEW')],
		get: [globalHooks.hasPermission('RELEASES_VIEW')],
		create: [globalHooks.hasPermission('RELEASES_CREATE')],
		update: [hooks.disable()],
		patch: [hooks.disable()],
		remove: [hooks.disable()]
	};
};

exports.after = {
  all: [],
  find: [],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: []
};
