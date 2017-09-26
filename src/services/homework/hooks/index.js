'use strict';

const stripJs = require('strip-js');
const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

const getAverageRating = function(submissions){
    // Durchschnittsnote berechnen
    if (submissions.length > 0) {
        // Nur bewertete Abgaben einbeziehen
        let submissiongrades = submissions.filter(s => Number.isInteger(s.grade));
        // Abgaben vorhanden?
        if(submissiongrades.length > 0){
            // Noten aus Abgabe auslesen
            submissiongrades = submissiongrades.map(s => s.grade);
            // Durchschnittsnote berechnen
            const ratingsum = submissiongrades.reduce(function(a, b) { return a + b; }, 0);
            return (ratingsum / submissiongrades.length).toFixed(2);
        }
    }
    return undefined;
};

const filterApplicableHomework = hook => {
    let data = hook.result.data || hook.result;
    data = data.filter(function (c) {
        return (new Date(c.availableDate).getTime() < Date.now()
            && c.courseId != null
            && ((c.courseId.userIds || []).indexOf(hook.params.account.userId) != -1) && !c.private)
          || JSON.stringify(c.teacherId) == JSON.stringify(hook.params.account.userId);
    });
    return Promise.resolve(hook);
};

const hasViewPermission = hook => {
    if(!hook.params.query['$populate'].includes('courseId')){
        hook.params.query['$populate'].push('courseId');
    }

    if(!hook.params.query['$or']){
        hook.params.query['$or'] = [
            {teacherId: hook.params.account.userId},
            {
                'courseId.userIds': hook.params.account.userId,
                'private': false,
                'availableDate': { $lte: Date.now() }
            }
        ];
    }else{
        hook.params.query['$or'].push({teacherId: hook.params.account.userId});
        hook.params.query['$or'].push({ 'courseId.userIds': hook.params.account.userId,
                                        'private': false,
                                        'availableDate': { $lte: Date.now() } });
    }
    return Promise.resolve(hook);
}

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
                if(!c.private){
                    let submissionP = (submissions.data.filter(function(n){return JSON.stringify(c._id) == JSON.stringify(n.homeworkId)
                        && n.comment != undefined && n.comment != ""}).length/((c.courseId || {}).userIds || []).length)*100;
                    let gradeP = (submissions.data.filter(function(n){return JSON.stringify(c._id) == JSON.stringify(n.homeworkId)
                            && ( n.gradeComment != '' || Number.isInteger(n.grade) )}).length/((c.courseId || {}).userIds || []).length)*100;
                    c.stats = {
                        userCount: ((c.courseId || {}).userIds || []).length,
                        submissionCount: submissions.data.filter(function(n){return JSON.stringify(c._id) == JSON.stringify(n.homeworkId)
                            && n.comment != undefined && n.comment != ""}).length,
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
    find: [globalHooks.mapPaginationQuery.bind(this), hasViewPermission],
    get: [hasViewPermission],
    create: [],
    update: [],
    patch: [],
    remove: []
};

exports.after = {
  all: [],
  find: [addStats],
  get: [addStats],
  create: [],
  update: [],
  patch: [],
  remove: []
};
