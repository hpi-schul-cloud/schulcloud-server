'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

exports.before = {
<<<<<<< 608e07b6831ba68a37c978bf8343ff6c9b8ff40f
  all: [],
=======
  all: [auth.hooks.authenticate('jwt')],
>>>>>>> pseudoservice basis
  find: [],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: []
};

exports.after = {
  all: [],
<<<<<<< 608e07b6831ba68a37c978bf8343ff6c9b8ff40f
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
=======
  find: [],
>>>>>>> pseudoservice basis
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: []
};
