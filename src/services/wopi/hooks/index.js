'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const service = require('../index');

exports.before = service => {
	return {
		all: [auth.hooks.authenticate('jwt')],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: []
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
