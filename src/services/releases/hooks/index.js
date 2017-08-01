'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication').hooks;
const model = require('../release-model');
const service = require('../index');

exports.before = service => {
	return {
		all: [auth.authenticate('jwt')],
		find: [],
		get: [],
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
