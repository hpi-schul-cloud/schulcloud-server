'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const errors = require('feathers-errors');

const filterApplicableSubmissions = hook => {
    let data = hook.result.data || hook.result; 
    if(hook.params.account){
        data = data.filter(function(e){
            let c = JSON.parse(JSON.stringify(e));
            return c.homeworkId.publicSubmissions
                    || c.homeworkId.teacherId.toString() == hook.params.account.userId.toString()
                    || c.studentId.toString() == hook.params.account.userId.toString()
                    || c.coWorkers.includes(hook.params.account.userId.toString());
        });
        (hook.result.data)?(hook.result.data = data):(hook.result = data);
    }
	return Promise.resolve(hook);
};

const noSubmissionBefore = hook => {
    if(hook.data.coWorkers){
        if(!Array.isArray(hook.data.coWorkers)){
            hook.data.coWorkers = [hook.data.coWorkers];
        }
        if(!hook.data.coWorkers.includes(hook.params.account.userId.toString())){
            hook.data.coWorkers.push(hook.params.account.userId.toString());
        }
    }else{
        hook.data.coWorkers = [hook.params.account.userId.toString()];
    }

    const submissionService = hook.app.service('/submissions');
    return submissionService.find({query: {
            homeworkId: hook.data.homeworkId,
            $populate: ['studentId']
        }}).then((submissions) => {
            let submissionsForMe = submissions.data.filter(raw => { 
                let e = JSON.parse(JSON.stringify(raw));
                return (e.coWorkers.includes(hook.params.account.userId.toString()))
                       && (e.studentId._id.toString() != hook.params.account.userId.toString());
            });
            if(submissionsForMe.length > 0){
                return Promise.reject(new errors.Conflict({
                  "message": submissions[0].studentId.firstName + " " + submissions[0].studentId.lastName + " hat bereits für dich abgegeben!"
                }));
            }

            let submissionsForCoWorkers = submissions.data.filter(raw => { 
                let e = JSON.parse(JSON.stringify(raw));
                hook.data.coWorkers.forEach(coWorker => {
                    if((e.coWorkers.includes(coWorker.toString())) 
                    || (e.studentId._id.toString() == coWorker.toString())){
                        return true;
                    }
                });
                return false;
            });
            if(submissionsForCoWorkers.length > 0){
                return Promise.reject(new errors.Conflict({
                  "message": "Einer deiner Teammitglieder hat bereits selbst eine Lösung abgegeben! Entferne dieses Mitglied!"
                }));
            }
        });
};


const maxCoWorkers = hook => {
    // min/max CoWorkers OKAY?
    const homeworkService = hook.app.service('/homework');
    return homeworkService.get(hook.data.homeworkId,
    {account: {userId: hook.params.account.userId}}).then(homework => {
        if(hook.data.coWorkers.length > 1 && !homework.teamSubmissions){
            return Promise.reject(new errors.Conflict({
                  "message": "Teamabgaben sind nicht erlaubt!"
                }));
        }
        if(hook.data.coWorkers.length > homework.maxCoWorkers && homework.maxCoWorkers > 1 && homework.teamSubmissions){
            return Promise.reject(new errors.Conflict({
                  "message": "Dein Team ist größer als erlaubt! ( maximal "+ homework.maxCoWorkers +" Teammitglieder erlaubt)"
                }));
        }
        return Promise.resolve(hook);
    });

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
  create: [noSubmissionBefore, maxCoWorkers, canGrade],
  update: [noSubmissionBefore, maxCoWorkers, canGrade],
  patch:  [noSubmissionBefore, maxCoWorkers, canGrade],
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
