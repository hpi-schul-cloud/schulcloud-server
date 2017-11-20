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
    console.log(typeof hook.data.coWorkers,hook.data.coWorkers);
    if(!(hook.data.grade || hook.data.gradeComment)){  // if student (noGrading) is going to modify coWorkers
        // make coWorkers an Array if it isn't already
        if(!Array.isArray(hook.data.coWorkers)){
            hook.data.coWorkers = (hook.data.coWorkers)?([hook.data.coWorkers]):[];
        }
        //  prevent that tasks have no owners
        if(!hook.data.coWorkers || hook.data.coWorkers.length == 0){
            hook.data.coWorkers = [hook.params.account.userId.toString()];
        }else{
            // current user is not going to remove himself
            if(hook.data.coWorkers.includes(hook.params.account.userId.toString())){
                hook.data.studentId = hook.params.account.userId.toString();
            }else{
                // he removed himself => new owner needed
                hook.data.studentId = hook.data.coWorkers[0];
            }
        }
    }
};
const setCoWorkers = hook => {
    if(!(hook.data.coWorkers || hook.data.grade || hook.data.gradeComment)){  // if student (no grading) is going to submit without coWorkers set
        hook.data.coWorkers = [hook.params.account.userId.toString()]; // set current User as coWorker
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
            if(hook.method == "create"){
                // check that no one has already submitted for the current User
                let submissionsForMe = submissions.data.filter(submissionRAW => { // is there an submission for the current user?
                    let submissions = JSON.parse(JSON.stringify(submissionRAW));
                    return (submissions.coWorkers.includes(hook.params.account.userId.toString()))
                           && (submissions.studentId._id.toString() != hook.params.account.userId.toString());
                });
                if(submissionsForMe.length > 0){
                    return Promise.reject(new errors.Conflict({
                      "message": submissionsForMe[0].studentId.firstName + " " + submissionsForMe[0].studentId.lastName + " hat bereits für dich abgegeben!"
                    }));
                }
            }
            function coWorkerHasAlreadySubmitted(Promise, hook, submissions, newCoWorkers){
                let toRemove = '';
                let submissionsForCoWorkers = submissions.data.filter(submissionRAW => { 
                    let submission = JSON.parse(JSON.stringify(submissionRAW));
                    for (var i = 0; i < newCoWorkers.length; i++) {
                        const coWorker = newCoWorkers[i].toString();
                        if(submission.coWorkers.includes(coWorker)
                            || (submission.studentId._id.toString() == coWorker)
                        ){
                            toRemove += (toRemove == '')?'':', ';
                            toRemove += submission.studentId.firstName + ' ' + submission.studentId.lastName;
                            return true;
                        }
                    }
                    return false;
                });
                if(submissionsForCoWorkers.length > 0){
                    return Promise.reject(new errors.Conflict({
                      "message": toRemove + ((submissionsForCoWorkers.length == 1)?' hat':' haben') + ' bereits eine Lösung abgegeben! Entferne diese' + ((submissionsForCoWorkers.length == 1)?'s Mitglied!':' Mitglieder!')
                    }));
                }else{
                    return Promise.resolve(hook);
                }
            }
            // check if a coWorker submitted a solution on his own => display names
            if(hook.data.coWorkers){
                // patch => only check for new team members
                if(hook.id){
                    return hook.app.service('/submissions').get(hook.id,{account: {userId: hook.params.account.userId}})
                    .then(currentSubmission => {
                        currentSubmission = JSON.parse(JSON.stringify(currentSubmission));
                        const newCoWorkers = hook.data.coWorkers.filter(coWorker => {
                            return !currentSubmission.coWorkers.includes(coWorker.toString());
                        });
                        return coWorkerHasAlreadySubmitted(Promise, hook, submissions, newCoWorkers);
                    });
                }else{
                    return coWorkerHasAlreadySubmitted(Promise, hook, submissions, hook.data.coWorkers);
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
        submission = JSON.parse(JSON.stringify(submission));
        if(submission.coWorkers.includes(hook.params.account.userId.toString())
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
  update: [isCoWorker, normalizeCoWorkers, preventMultipleSubmissions, maxCoWorkers, canGrade],
  patch:  [isCoWorker, normalizeCoWorkers, preventMultipleSubmissions, maxCoWorkers, canGrade],
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