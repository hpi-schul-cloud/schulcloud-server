'use strict';

const globalHooks = require('../../../hooks');
const auth = require('@feathersjs/authentication').hooks;
//const model = require('../link-model');
//const service = require('../index');

exports.before = service => {
	return {
		all: [],
		find: [],
		get: [hooks.disable('external')],	// handled by redirection middleware
		create: [auth.authenticate('jwt'), globalHooks.hasPermission('LINK_CREATE')],
		update: [hooks.disable()],
		patch: [hooks.disable()],
		remove: [globalHooks.ifNotLocal(hooks.disable())]
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
