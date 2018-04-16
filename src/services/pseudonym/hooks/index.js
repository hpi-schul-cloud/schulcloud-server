'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

exports.before = {
  all: [],
  find: (hook) => {
	  if (hook.params.query.toolId) { // rewrite tool id if there is a origin tool (same provider)
		  let toolService = hook.app.service('ltiTools');
		  return toolService.get(hook.params.query.toolId).then(tool => {
		  	hook.params.query.toolId = tool.originTool || hook.params.query.toolId;
			return hook;
		  });
	  }
	  return hook
  },
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: []
};

exports.after = {
  all: [],
  find: (hook) => {
  	const userIds = (Array.isArray(hook.params.query.userId)
	  ? hook.params.query.userId
	  : [hook.params.query.userId]);
  	const toolIds = (Array.isArray(hook.params.query.toolId)
	  ? hook.params.query.toolId
	  : [hook.params.query.toolId]);

  	let pseudoService = hook.app.service('pseudonym');
  	let pseudonyms = []
  	for (let userId of userIds) {
	  for (let toolId of toolIds) {
		if (!hook.result.data.find(entry => (entry.userId.toString() == userId && entry.toolId.toString() == toolId))) {
		  pseudonyms.push({userId, toolId});
		}
	  }
	}

	return pseudoService.create(pseudonyms).then((pseudonym) => {
	  if (pseudonym) {
	  	hook.result.data = hook.result.data.concat(pseudonym);
	  }

	  return hook;
	})
  },
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: []
};
