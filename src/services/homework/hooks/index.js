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
        var numSubmissions = 0;
        var gradeSum = 0;
        submissiongrades.forEach(e => {
            if(e.teamMembers && e.teamMembers.length > 0){
                numSubmissions += e.teamMembers.length;
                gradeSum += (e.teamMembers.length * e.grade);
            }else{
                numSubmissions += 1;
                gradeSum += e.grade;
            }
        });

        // Abgaben vorhanden?
        if(numSubmissions > 0){
            // Durchschnittsnote berechnen
            return (gradeSum / numSubmissions).toFixed(2);
        }
    }
    return undefined;
};
function isValidSubmission(submission){
    return  (submission.comment && submission.comment != "")
         || (submission.fileIds && submission.fileIds.length > 0);
}
function isGraded(submission){
    return  (submission.gradeComment && submission.gradeComment != '')
         || (submission.grade && Number.isInteger(submission.grade));
}
                    
const hasViewPermissionBefore = hook => {
    // Add populate to query to be able to filter permissions
    if((hook.params.query||{})['$populate']){
        if(!hook.params.query['$populate'].includes('courseId')){
            hook.params.query['$populate'].push('courseId');
        }
    }else{
        if(!hook.params.query){
            hook.params.query = {};
        }
        hook.params.query['$populate'] = ['courseId'];
    }
    const userId = (hook.params.account || {}).userId;
    // filter most homeworks where the user has no view permission
    if(!hook.params.query['$or']){
        hook.params.query['$or'] = [{teacherId: userId},
                                    {'private': {$nin:[true]} }];
    }else{
        hook.params.query['$or'].push({teacherId: userId});
        hook.params.query['$or'].push({'private': {$nin:[true]} });
    }
    return Promise.resolve(hook);
};

const hasViewPermissionAfter = hook => {
    // filter any other homeworks where the user has no view permission
    // user is teacher OR ( user is in courseId of task AND availableDate < Date.now() )
    // availableDate < Date.now()
    function hasPermission(e){
        const isTeacher = (e.teacherId == (hook.params.account || {}).userId);
        const isStudent = ( (e.courseId != null)
                        && ((e.courseId || {}).userIds || []).includes(((hook.params.account || {}).userId || "").toString()) );
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
                var c = JSON.parse(JSON.stringify(e)); // don't know why, but without this line it's not working :/

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

                    const NumberOfCourseMembers = ((c.courseId || {}).userIds || []).length;
                    const currentSubmissions = submissions.data.filter(function(submission){return c._id.toString() == submission.homeworkId.toString();});
                    const validSubmissions = currentSubmissions.filter(isValidSubmission);
                    const gradedSubmissions = currentSubmissions.filter(isGraded)
                    const NumberOfUsersWithSubmission = validSubmissions.map(e => {return (e.teamMembers || [1]).length;}).reduce((a, b) => a+b, 0);
                    const NumberOfGradedUsers = gradedSubmissions.map(e => {return (e.teamMembers || [1]).length;}).reduce((a, b) => a+b, 0);
                    const submissionPerc = ( NumberOfUsersWithSubmission / NumberOfCourseMembers)*100;
                    const gradePerc = (NumberOfGradedUsers / NumberOfCourseMembers)*100;

                    c.stats = {
                        userCount:              ((c.courseId || {}).userIds || []).length,
                        submissionCount:        NumberOfUsersWithSubmission,
                        submissionPercentage:   (submissionPerc != Infinity)?submissionPerc.toFixed(2):undefined,
                        gradeCount:             NumberOfGradedUsers,
                        gradePercentage:        (gradePerc != Infinity)?gradePerc.toFixed(2):undefined,
                        averageGrade:           getAverageRating(currentSubmissions)
                    };
                }
                return c;
            });
            if(arrayed){data = data[0];}
            (hook.result.data)?(hook.result.data = data):(hook.result = data);
            return Promise.resolve(hook);
    });
};

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