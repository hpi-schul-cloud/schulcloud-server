'use strict';

const stripJs = require('strip-js');
const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const errors = require('feathers-errors');

const getAverageRating = function(submissions){
    // Durchschnittsnote berechnen
    if (submissions.length > 0) {
        // Nur bewertete Abgaben einbeziehen
        let submissiongrades = submissions.filter(s => Number.isInteger(s.grade));
        // Abgabe für jedes Teammitglied einzeln werten
        let numSubmissions = 0;
        let grades = [];
        submissiongrades.forEach(e => {
            if(e.coWorkers){
                numSubmissions += e.coWorkers.length;
                for (var i = 0; i < e.coWorkers.length; i++) { 
                    grades.push(e.grade);
                }
            }else{
                numSubmissions += 1;
                grades.push(e.grade);
            }
        });
        
        // Abgaben vorhanden?
        if(numSubmissions > 0){
            // Durchschnittsnote berechnen
            const gradeSum = grades.reduce(function(a, b) { return a + b; }, 0);
            return (gradeSum / numSubmissions).toFixed(2);
        }
    }
    return undefined;
};

const hasViewPermissionBefore = hook => {
    // Add populate to query to be able to filter permissions
    if(hook.params.query['$populate']){
        if(!hook.params.query['$populate'].includes('courseId')){
            hook.params.query['$populate'].push('courseId');
        }
    }else{
        hook.params.query['$populate'] = ['courseId'];
    }

    // filter most homeworks where the user has no view permission
    if(!hook.params.query['$or']){
        hook.params.query['$or'] = [{teacherId: hook.params.account.userId},
                                    {'private': {$nin:[true]} }];
    }else{
        hook.params.query['$or'].push({teacherId: hook.params.account.userId});
        hook.params.query['$or'].push({'private': {$nin:[true]} });
    }
    return Promise.resolve(hook);
}

const hasViewPermissionAfter = hook => {
    // filter any other homeworks where the user has no view permission
    // user is teacher OR ( user is in courseId of task AND availableDate < Date.now() )
    // availableDate < Date.now()
    function hasPermission(e){
        const isTeacher = (e.teacherId == hook.params.account.userId);
        const isStudent = ( (e.courseId != null)
                        && ((e.courseId || {}).userIds || []).includes(hook.params.account.userId.toString()) );
        const published = (( new Date(e.availableDate) < new Date() )) && !e.private;   
        return isTeacher || (isStudent && published);
    }

    let data = JSON.parse(JSON.stringify(hook.result.data || hook.result));
    if(data[0] != undefined){
        data = data.filter(hasPermission);
    }else{
        // check if it is a single homework AND user has view permission
        if(data.schoolId != undefined && !hasPermission(data)){
            return Promise.reject(new errors.Forbidden("You don't have permissions!"));
        }
    }
    (hook.result.data)?(hook.result.data = data):(hook.result = data);
    return Promise.resolve(hook);
};

const addStats = hook => {
    let data = hook.result.data || hook.result;
    const submissionService = hook.app.service('/submissions');
    const arrayed = !(Array.isArray(data));
    data = (Array.isArray(data))?(data):([data]);
    return submissionService.find({query: {
            homeworkId: {$in: (data.map(n => n._id))}
        }}).then((submissions) => {
            data = data.map(function(e){
                var c = JSON.parse(JSON.stringify(e)) // don't know why, but without this line it's not working :/

                // save grade in assignment if user is student of this task
                const submission = submissions.data.filter(s => {
                    return ( (c._id.toString() == s.homeworkId.toString()) && (s.grade) );
                });
                if(submission.length == 1  && c.teacherId.toString() != hook.params.account.userId.toString()){
                    c.grade = submission[0].grade;
                }

                if( !c.private && (
                    ( ((c.courseId || {}).userIds || []).includes(hook.params.account.userId.toString()) && c.publicSubmissions )
                    || ( c.teacherId == hook.params.account.userId.toString() ) ) ){
                    let submissionP = (submissions.data.filter(function(n){return JSON.stringify(c._id) == JSON.stringify(n.homeworkId)
                        && n.comment != undefined && n.comment != ""}).length/((c.courseId || {}).userIds || []).length)*100;
                    let gradeP = (submissions.data.filter(function(n){return JSON.stringify(c._id) == JSON.stringify(n.homeworkId)
                            && ( n.gradeComment != '' || Number.isInteger(n.grade) )}).length/((c.courseId || {}).userIds || []).length)*100;
                    c.stats = {
                        userCount: ((c.courseId || {}).userIds || []).length,
                        submissionCount: submissions.data.filter(function(n){return  JSON.stringify(c._id) == JSON.stringify(n.homeworkId) && n.comment != undefined && n.comment != ""}).map(e => {return (e.coWorkers.length || 1)}).reduce((a, b) => a+b, 0),
                        submissionPercentage: (submissionP && submissionP != Infinity)?submissionP.toFixed(2):undefined,
                        gradeCount: submissions.data.filter(function(n){return JSON.stringify(c._id) == JSON.stringify(n.homeworkId)
                            && ( n.gradeComment != '' || Number.isInteger(n.grade) )}).length,
                        gradePercentage: (gradeP && gradeP != Infinity)?gradeP.toFixed(2):undefined,
                        averageGrade: getAverageRating(submissions.data.filter(function(n){return JSON.stringify(c._id) == JSON.stringify(n.homeworkId);}))
                    };
                }
                return c;
            });
            if(arrayed){data = data[0];}
            (hook.result.data)?(hook.result.data = data):(hook.result = data);
    });
}

exports.before = {
    all: [auth.hooks.authenticate('jwt'), (hook) => {
        if (hook.data && hook.data.description) {
            hook.data.description = stripJs(hook.data.description);
        }

        return hook;
    }],
    find: [globalHooks.mapPaginationQuery.bind(this), hasViewPermissionBefore],
    get: [hasViewPermissionBefore],
    create: [],
    update: [],
    patch: [],
    remove: []
};

exports.after = {
  all: [],
  find: [hasViewPermissionAfter,addStats],
  get: [hasViewPermissionAfter,addStats],
  create: [],
  update: [],
  patch: [],
  remove: []
};