'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication').hooks;
const model = require('../link-model');
const service = require('../index');

const findByShortId = service => {
	return hook => {
		// use hook.params here
		if(hook.params.id.length == service.Model.linkLength) {

		}
		return Promise.resolve(hook);
	};
};

exports.before = service => {
	return {
		all: [],
		find: [],
		get: [/*globalHooks.resolveToIds.bind(this, '/links', 'data.id', 'id')*/],
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
