'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication').hooks;

const sanitize = (hook) => {
	return globalHooks.isSuperHero()(hook).then(() => {
		return hook;
	}).catch(() => {
		if(hook.method === "find"){
			hook.result.data = hook.result.data.map((entry) => {
				delete entry.fetchUrl;
				delete entry.documentUrl;
				return entry;
			});
		}
		if(hook.method === "get"){
			delete hook.result.fetchUrl;
			delete hook.result.documentUrl;
		}
		return hook;
	});
}

exports.before = service => {
	if(service === "timelineFetch") {
		return {
			all: [auth.authenticate('jwt')],
			find: [hooks.disable()],
			get: [globalHooks.isSuperHero()],
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
			create: [globalHooks.isSuperHero()],
			update: [globalHooks.isSuperHero()],
			patch: [globalHooks.isSuperHero()],
			remove: [globalHooks.isSuperHero()]
		};
	}
};

exports.after = {
  all: [],
  find: [sanitize],
  get: [sanitize],
  create: [],
  update: [],
  patch: [],
  remove: []
};
