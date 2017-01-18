'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication').hooks;
const model = require('../link-model');
const service = require('../index');

exports.before = service => {
	return {
		all: [],
		find: [hooks.disable()],
		get: [hooks.disable('external')],	// handled by redirection middleware
		create: [],
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
