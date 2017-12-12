'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

exports.before = {
  all: [],
  find: [],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: []
};

exports.after = {
  all: [],
  find: (hook) => {
  	if (!hook.result.data.length) {
  	  let pseudoService = hook.app.service('pseudonym');
  	  return pseudoService.create({
		  userId: hook.params.query.userId,
		  toolId: hook.params.query.toolId
	  }).then((pseudonym) => {
		hook.result.data = [pseudonym];
		return hook;
	  })
	}
  },
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: []
};
