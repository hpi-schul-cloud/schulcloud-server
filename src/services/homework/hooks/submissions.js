'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

const filterApplicableSubmissions = hook => {
	console.log(hook.result.data);
	let uId = hook.params.account.userId;
	hook.result.data = hook.result.data.filter(function(c){
		return c.homeworkId.publicSubmissions
				|| JSON.stringify(c.homeworkId.teacherId) == JSON.stringify(uId)
				|| JSON.stringify(c.studentId) == JSON.stringify(uId);
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
  find: [filterApplicableSubmissions],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: []
};
