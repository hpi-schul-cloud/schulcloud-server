'use strict';

const commonHooks = require('feathers-hooks-common');
const globalHooks = require('../../../hooks');
const auth = require('@feathersjs/authentication').hooks;
const model = require('../link-model');
const service = require('../index');

exports.before = service => {
	return {
		all: [],
		find: [],
		get: [commonHooks.disallow('external')],	// handled by redirection middleware
		create: [auth.authenticate('jwt'), globalHooks.hasPermission('LINK_CREATE')],
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
