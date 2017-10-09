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

const canGrade = hook => {
    if(Number.isInteger(hook.data.grade)){
        const homeworkService = hook.app.service('/homework');
        return homeworkService.get(hook.data.homeworkId,
        {account: {userId: hook.params.account.userId}}).then(homework => {
            if(homework.teacherId != hook.params.account.userId){
                return Promise.reject(new errors.Forbidden());
            }else{
                return Promise.resolve(hook);
            }
        });
    }else{
        return Promise.resolve(hook);
    }
};

exports.before = {
  all: [auth.hooks.authenticate('jwt')],
  find: [globalHooks.mapPaginationQuery.bind(this)],
  get: [],
  create: [canGrade],
  update: [canGrade],
  patch: [canGrade],
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
