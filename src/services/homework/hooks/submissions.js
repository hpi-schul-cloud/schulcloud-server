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
            if(typeof c.coWorkers[0] === 'object'){
                c.coWorkers = c.coWorkers.map(e => {return e._id;}); // map coWorkers list to _id list (if $populate(d) is used)
            }
            return     c.homeworkId.publicSubmissions                                               // publicSubmissions allowes (everyone can see)
                    || c.homeworkId.teacherId.toString() == hook.params.account.userId.toString()   // or user is teacher
                    || c.studentId.toString() == hook.params.account.userId.toString()              // or is student (may not needed because all students should be in coWorkers)
                    || c.coWorkers.includes(hook.params.account.userId.toString());                 // or in the team                    
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
    }else if(!(hook.data.grade || hook.data.gradeComment)){
        hook.data.coWorkers = [hook.params.account.userId.toString()];
    }
    //console.log("studentId");
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
                  "message": submissionsForMe[0].studentId.firstName + " " + submissionsForMe[0].studentId.lastName + " hat bereits für dich abgegeben!"
                }));
            }

            let submissionsForCoWorkers = submissions.data.filter(raw => { 
                let e = JSON.parse(JSON.stringify(raw));
                (hook.data.coWorkers || [hook.params.account.userId]).forEach(coWorker => {
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
    if(hook.data.homeworkId && hook.data.coWorkers){
        const homeworkService = hook.app.service('/homework');
        return homeworkService.get(hook.data.homeworkId,
        {account: {userId: hook.params.account.userId}}).then(homework => {
            if(hook.data.coWorkers.length > 1 && !homework.teamSubmissions){
                return Promise.reject(new errors.Conflict({
                      "message": "Teamabgaben sind nicht erlaubt!"
                    }));
            }
            if(homework.teamSubmissions && homework.maxCoWorkers 
            && homework.maxCoWorkers >= 1 && hook.data.coWorkers.length > homework.maxCoWorkers){
                return Promise.reject(new errors.Conflict({
                      "message": "Dein Team ist größer als erlaubt! ( maximal "+ homework.maxCoWorkers +" Teammitglieder erlaubt)"
                    }));
            }
            return Promise.resolve(hook);
        });
    }else{
        return Promise.resolve(hook);
    }
};

const canGrade = hook => {
    if(Number.isInteger(hook.data.grade) || typeof hook.data.gradeComment == "string"){ // does the user try to grade?
        // get homework data to get the teacherId
        const homeworkService = hook.app.service('/homework');
        return homeworkService.get(hook.data.homeworkId,
        {account: {userId: hook.params.account.userId}}).then(homework => {
            if(homework.teacherId != hook.params.account.userId){ // user isn't a teacher of this homework
                return Promise.reject(new errors.Forbidden());
            }else{
                return Promise.resolve(hook);
            }
        });
    }else{ // no grading => no possible rejections
        return Promise.resolve(hook);
    }
};

exports.before = {
  all: [auth.hooks.authenticate('jwt')],
  find: [globalHooks.mapPaginationQuery.bind(this)],
  get: [],
  create: [noSubmissionBefore, maxCoWorkers, canGrade],
  update: [maxCoWorkers, canGrade],
  patch:  [maxCoWorkers, canGrade],
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