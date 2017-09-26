'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

const filterApplicableSubmissions = hook => {
    let data = hook.result.data || hook.result; 
    if(hook.params.account){
        data = data.filter(function(c){
            return c.homeworkId.publicSubmissions
                    || JSON.stringify(c.homeworkId.teacherId) == JSON.stringify(hook.params.account.userId)
                    || JSON.stringify(c.studentId) == JSON.stringify(hook.params.account.userId);
        });
        (hook.result.data)?(hook.result.data = data):(hook.result = data);
    }
	return Promise.resolve(hook);
};

exports.before = {
  all: [auth.hooks.authenticate('jwt')],
  find: [globalHooks.hasPermission('SUBMISSIONS_VIEW'), globalHooks.mapPaginationQuery.bind(this)],
  get: [globalHooks.hasPermission('SUBMISSIONS_VIEW')],
  create: [globalHooks.hasPermission('SUBMISSIONS_CREATE')],
  update: [globalHooks.hasPermission('SUBMISSIONS_EDIT')],
  patch: [globalHooks.hasPermission('SUBMISSIONS_EDIT')],
  remove: [globalHooks.hasPermission('SUBMISSIONS_CREATE')]
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
