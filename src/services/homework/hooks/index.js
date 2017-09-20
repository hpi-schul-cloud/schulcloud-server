'use strict';

const stripJs = require('strip-js');
const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

const getAverageRating = function(submissions,gradeSystem){
    // Durchschnittsnote berechnen
    if (submissions.length > 0) {
        // Nur bewertete Abgaben einbeziehen
        let submissiongrades = submissions.filter(function(sub){return (sub.grade!=null);});
        // Abgaben vorhanden?
        if(submissiongrades.length > 0){
            // Noten aus Abgabe auslesen (& in Notensystem umwandeln)
            if (gradeSystem) {
                submissiongrades = submissiongrades.map(function (sub) {
                    return 6 - Math.ceil(sub.grade / 3);
                });
            } else {
                submissiongrades = submissiongrades.map(function (sub) {
                    return sub.grade;
                });
            }
            // Durchschnittsnote berechnen
            let ratingsum = 0;
            submissiongrades.forEach(function (e) {
                ratingsum += e;
            });
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
    const submissionService = hook.app.service('/submissions');
    return submissionService.find({query: {
            homeworkId: {$in: data.map(function(n){
                return n._id;
            })}
        }}).then((submissions) => {
            data = data.map(function(c){
                c.stats = "undefined long string ####################"
                /*c["stats"] = {
                    userCount: c.courseId.userIds.length,
                    submissionCount: submissions.data.filter(function(n){return JSON.stringify(c._id) == JSON.stringify(n.homeworkId)
                        && n.comment != undefined && n.comment != ""}).length,
                    submissionPercentage: submissions.data.filter(function(n){return JSON.stringify(c._id) == JSON.stringify(n.homeworkId)
                        && n.comment != undefined && n.comment != ""}).length/c.courseId.userIds.length,
                    gradeCount: submissions.data.filter(function(n){return JSON.stringify(c._id) == JSON.stringify(n.homeworkId)
                        && n.gradeComment != '' && n.grade != null}).length,
                    gradePercentage: submissions.data.filter(function(n){return JSON.stringify(c._id) == JSON.stringify(n.homeworkId)
                        && n.gradeComment != '' && n.grade != null}).length/c.courseId.userIds.length,
                    averageGrade: getAverageRating(submissions.data, c.courseId.gradeSystem)
                };
                console.log("-------------------");
                console.log("C:",c);
                console.log("Stats:",c.stats);
                */
                return c;
            });
            data = data.map(function(c){
                c["abc"] = "cde";
                return c;
            });
            console.log("OUTPUT:",data);
            console.log("-------------------");
            (hook.result.data)?(hook.result.data = data):(hook.result = data);
    });
    
    return Promise.resolve(hook);
};

exports.before = {
    all: [auth.hooks.authenticate('jwt'), (hook) => {
        if (hook.data && hook.data.description) {
            hook.data.description = stripJs(hook.data.description);
        }

        return hook;
    }],
    find: [globalHooks.mapPaginationQuery.bind(this)],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
};

exports.after = {
  all: [],
  find: [filterApplicableHomework],
  get: [filterApplicableHomework],
  create: [],
  update: [],
  patch: [],
  remove: []
};
