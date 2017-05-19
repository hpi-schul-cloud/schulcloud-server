'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

const filterApplicableHomework = hook => {
	let uId = hook.params.account.userId;
	hook.result.data = hook.result.data.filter(function(c){
		return (new Date(c.availableDate).getTime() < Date.now()
			&& c.courseId != null
			&& (c.courseId.userIds || []).indexOf(uId) != -1)
			|| JSON.stringify(c.teacherId)==JSON.stringify(uId);
	});
	return Promise.resolve(hook);
};

exports.before = {
  all: [auth.hooks.authenticate('jwt')],
  find: [],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: []
};

exports.after = {
  all: [],
  find: [filterApplicableHomework],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: []
};
