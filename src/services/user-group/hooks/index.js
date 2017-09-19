'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const _ = require('lodash');
const ClassModel = require('../model').classModel;
const CourseModel = require('../model').courseModel;

const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);

/**
 * adds all students to a course when a class is added to the course
 * @param hook - contains created/patched object und request body
 */
const addWholeClassToCourse = (hook) => {
	let requestBody = hook.data;
	let course = hook.result;
	if ((requestBody.classIds || []).length > 0) { // just courses do have a property "classIds"
		return Promise.all(requestBody.classIds.map(classId => {
			return ClassModel.findById(classId).exec().then(c =>  c.userIds);
		})).then(studentIds => {
			// flatten deep arrays and remove duplicates
			studentIds = _.uniqWith(_.flattenDeep(studentIds), (e1, e2) => JSON.stringify(e1) === JSON.stringify(e2));

			// add all students of classes to course, if not already added
			return Promise.all(studentIds.map(s => {
				if (course.userIds.indexOf(s) < 0) {
					return CourseModel.update({_id: course._id}, {$push: {userIds: s}}).exec();
				} else {
					return {};
				}
			})).then(_ => hook);
		});
	} else {
		return hook;
	}
};

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [globalHooks.hasPermission('USERGROUP_VIEW'), restrictToCurrentSchool],
	get: [],
	create: [globalHooks.hasPermission('USERGROUP_CREATE')],
	update: [globalHooks.hasPermission('USERGROUP_EDIT'), restrictToCurrentSchool],
	patch: [globalHooks.hasPermission('USERGROUP_EDIT'), restrictToCurrentSchool],
	remove: [globalHooks.hasPermission('USERGROUP_CREATE'), restrictToCurrentSchool]
};

exports.after = {
	all: [],
	find: [],
	get: [globalHooks.ifNotLocal(globalHooks.denyIfNotCurrentSchool({errorMessage: 'Die angefragte Gruppe gehört nicht zur eigenen Schule!'}))],
	create: [addWholeClassToCourse],
	update: [],
	patch: [addWholeClassToCourse],
	remove: []
};
