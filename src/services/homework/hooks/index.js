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
            if(e.courseGroupId && (e.courseGroupId.userIds || []) > 0) {
                numSubmissions += e.courseGroupId.userIds.length;
                gradeSum += (e.courseGroupId.userIds * e.grade);
            } else if(e.teamMembers && e.teamMembers.length > 0) {
                numSubmissions += e.teamMembers.length;
                gradeSum += (e.teamMembers.length * e.grade);
            } else {
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
function isTeacher(userId, homework){
    const user = userId.toString();
    let isTeacher = (homework.teacherId.toString() == user);
    if(!isTeacher && !homework.private){
        const isCourseTeacher = homework.courseId.teacherIds.includes(user);
        const isCourseSubstitution = homework.courseId.substitutionIds.includes(user);
        isTeacher = isCourseTeacher || isCourseSubstitution;
    }
    return isTeacher;
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
    return Promise.resolve(hook);
};

const hasViewPermissionAfter = hook => {
    // filter any other homeworks where the user has no view permission
    // user is teacher OR ( user is in courseId of task AND availableDate < Date.now() )
    // availableDate < Date.now()
    function hasPermission(e){
        const isTeacher = (e.teacherId == (hook.params.account || {}).userId)
                        || (!e.private && ((e.courseId || {}).teacherIds||[]).includes((hook.params.account || {}).userId.toString()))
                        || (!e.private && ((e.courseId || {}).substitutionIds||[]).includes((hook.params.account || {}).userId.toString()));
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
    (hook.result.data)?(hook.result.total = data.length):(hook.total = data.length);
    return Promise.resolve(hook);
};

const addStats = hook => {
    let data = hook.result.data || hook.result;
    const submissionService = hook.app.service('/submissions');
    const arrayed = !(Array.isArray(data));
    data = (Array.isArray(data))?(data):([data]);
    return submissionService.find({query: {
            homeworkId: {$in: (data.map(n => n._id))},
            $populate: ['courseGroupId']
        }}).then((submissions) => {
            data = data.map(function(e){
                var c = JSON.parse(JSON.stringify(e)); // don't know why, but without this line it's not working :/

                // save grade in assignment if user is student of this task
                const submission = submissions.data.filter(s => {
                    return ( (c._id.toString() == s.homeworkId.toString()) && (s.grade) );
                });
                if(submission.length == 1  && !isTeacher(hook.params.account.userId, c)){
                    c.grade = submission[0].grade;
                }

                if( !c.private && (
                    ( ((c.courseId || {}).userIds || []).includes(hook.params.account.userId.toString()) && c.publicSubmissions )
                    || isTeacher(hook.params.account.userId, c) ) ){

                    const NumberOfCourseMembers = ((c.courseId || {}).userIds || []).length;
                    const currentSubmissions = submissions.data.filter(function(submission){return c._id.toString() == submission.homeworkId.toString();});
                    const validSubmissions = currentSubmissions.filter(isValidSubmission);
                    const gradedSubmissions = currentSubmissions.filter(isGraded);
                    const NumberOfUsersWithSubmission = validSubmissions.map(e => {
                        return e.courseGroupId ? ((e.courseGroupId.userIds || []).length || 1) : ((e.teamMembers || []).length || 1);
                    }).reduce((a, b) => a+b, 0);

                    const NumberOfGradedUsers = gradedSubmissions.map(e => {
                        return e.courseGroupId ? ((e.courseGroupId.userIds || []).length || 1) : ((e.teamMembers || []).length || 1);
                    }).reduce((a, b) => a+b, 0);
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
                    c.isTeacher = isTeacher(hook.params.account.userId, c);
                }
                return c;
            });
            if(arrayed){data = data[0];}
            (hook.result.data)?(hook.result.data = data):(hook.result = data);
            return Promise.resolve(hook);
    });
};

const hasPatchPermission = hook => {
    const homeworkService = hook.app.service('/homework');
    return homeworkService.get(hook.id,{
        query: {$populate: ['courseId']},
        account: {userId: hook.params.account.userId}
    }).then((homework) => {
        if(isTeacher(hook.params.account.userId, homework)) {
            return Promise.resolve(hook);
        }else{
            return Promise.reject(new errors.Forbidden());
        }
    })
    .catch(err => {
        return Promise.reject(new errors.GeneralError({"message":"[500 INTERNAL ERROR] - can't reach homework service @isTeacher function"}));
    });
};

exports.before = {
    all: [auth.hooks.authenticate('jwt'), (hook) => {
        if (hook.data && hook.data.description) {
            hook.data.description = stripJs(hook.data.description);
        }
        return hook;
    }],
    find: [globalHooks.hasPermission('HOMEWORK_VIEW'), globalHooks.mapPaginationQuery.bind(this), hasViewPermissionBefore],
    get: [globalHooks.hasPermission('HOMEWORK_VIEW'), hasViewPermissionBefore],
    create: [globalHooks.hasPermission('HOMEWORK_CREATE')],
    update: [globalHooks.hasPermission('HOMEWORK_EDIT')],
    patch: [globalHooks.hasPermission('HOMEWORK_EDIT'),globalHooks.permitGroupOperation, hasPatchPermission],
    remove: [globalHooks.hasPermission('HOMEWORK_CREATE'),globalHooks.permitGroupOperation]
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
