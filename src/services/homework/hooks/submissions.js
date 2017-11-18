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
                    || c.studentId.toString() == hook.params.account.userId.toString()              // or is student (only needed for old tasks, in new tasks all users shoudl be in coWorkers)
                    || c.coWorkers.includes(hook.params.account.userId.toString());                 // or in the team                    
        });
        (hook.result.data)?(hook.result.data = data):(hook.result = data);
    }
	return Promise.resolve(hook);
};

const normalizeCoWorkers = hook => {
    if(hook.data.coWorkers && !(hook.data.grade || hook.data.gradeComment)){  // if student (noGrading) is going to modify coWorkers
        // make coWorkers an Array if it isn't already
        if(!Array.isArray(hook.data.coWorkers)){
            hook.data.coWorkers = (hook.data.coWorkers)?([hook.data.coWorkers]):[];
        }
        // add current User if he isn't included already
        if(!hook.data.coWorkers.includes(hook.params.account.userId.toString())){
            hook.data.coWorkers.push(hook.params.account.userId.toString());
        }
        // set current User as studentId (allways contains the user who did the latest changes)
        if(hook.data.studentId){
            hook.data.studentId = hook.params.account.userId.toString();
        }
    }
};
const setCoWorkers = hook => {
    if(!(hook.data.coWorkers || hook.data.grade || hook.data.gradeComment)){  // if student (no grading) is going to submit without coWorkers set
        // set current User as coWorker if no coWorker Data submitted
        hook.data.coWorkers = [hook.params.account.userId.toString()];
    }
};

const preventMultipleSubmissions = hook => {
    if(!(hook.data.grade || hook.data.gradeComment)){ // if student wan't to submit anything
        // get all the submissions for the homework
        const submissionService = hook.app.service('/submissions');
        return submissionService.find({
            query: {
                homeworkId: hook.data.homeworkId,
                $populate: ['studentId']
        }}).then((submissions) => {
            // check that no one has already submitted for the current User
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
            // check if a coWorker submitted a solution on his own => display names
            if(hook.data.coWorkers){
                let toRemove = '';
                let submissionsForCoWorkers = submissions.data.filter(raw => { 
                    let e = JSON.parse(JSON.stringify(raw));
                    for (var i = 0; i < hook.data.coWorkers.length; i++) {
                        const coWorker = hook.data.coWorkers[i].toString();
                        if((e.coWorkers.includes(coWorker)
                            || (e.studentId._id.toString() == coWorker))
                            && (e.studentId._id.toString() != hook.params.account.userId.toString())){
                            toRemove += (toRemove == '')?'':', ';
                            toRemove += e.studentId.firstName + ' ' + e.studentId.lastName;
                            return true;
                        }
                    }
                    return false;
                });
                if(submissionsForCoWorkers.length > 0){
                    return Promise.reject(new errors.Conflict({
                      "message": toRemove + ((submissionsForCoWorkers.length == 1)?' hat':' haben') + ' bereits eine Lösung abgegeben! Entferne diese' + ((submissionsForCoWorkers.length == 1)?'s Mitglied!':' Mitglieder!')
                    }));
                }
            }
        });
    }
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

const isCoWorker = hook => {
    // only allow deletion for team Members
    const submissionService = hook.app.service('/submissions');
    return submissionService.get(hook.id).then((submission) => {
        if(JSON.parse(JSON.stringify(submission.coWorkers)).includes(hook.params.account.userId.toString())
            || submission.studentId == hook.params.account.userId.toString()){
            return Promise.resolve(hook);
        }
        return Promise.reject(new errors.Forbidden());
    })
};

/*
Note: always set the coWorkers
*/
exports.before = {
  all: [auth.hooks.authenticate('jwt')],
  find: [globalHooks.mapPaginationQuery.bind(this)],
  get: [],
  create: [setCoWorkers, normalizeCoWorkers, preventMultipleSubmissions, maxCoWorkers, canGrade],
  update: [normalizeCoWorkers, preventMultipleSubmissions, maxCoWorkers, canGrade],
  patch:  [normalizeCoWorkers, preventMultipleSubmissions, maxCoWorkers, canGrade],
  remove: [isCoWorker]
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