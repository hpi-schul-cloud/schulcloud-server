'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

const filterApplicableSubmissions = hook => {
	let data = hook.result.data || hook.result;
	if(hook.params.account) {
		let uId = hook.params.account.userId;
		data = data.filter(function (c) {
			return c.homeworkId.publicSubmissions
				|| JSON.stringify(c.homeworkId.teacherId) == JSON.stringify(uId)
				|| JSON.stringify(c.studentId) == JSON.stringify(uId);
		});
	}
	if (hook.result.data)
		hook.result.data = data;
	else
		hook.result = data;

	return Promise.resolve(hook);
};

exports.before = {
  all: [auth.hooks.authenticate('jwt')],
  find: [globalHooks.mapPaginationQuery.bind(this)],
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
