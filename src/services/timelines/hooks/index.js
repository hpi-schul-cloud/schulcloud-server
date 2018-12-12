'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication').hooks;

exports.before = service => {
	if(service === "timelineFetch") {
		return {
			all: [auth.authenticate('jwt')],
			find: [hooks.disable()],
			get: [globalHooks.isSuperHero],
			create: [hooks.disable()],
			update: [hooks.disable()],
			patch: [hooks.disable()],
			remove: [hooks.disable()]
		};
	} else {
		return {
			all: [globalHooks.forceHookResolve(auth.authenticate('jwt'))],
			find: [],
			get: [],
			create: [globalHooks.isSuperHero],
			update: [globalHooks.isSuperHero],
			patch: [globalHooks.isSuperHero],
			remove: [globalHooks.isSuperHero]
		};
	}
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
