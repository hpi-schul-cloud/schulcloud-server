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
 * @param hook - contains created/patched object and request body
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

/**
 * deletes all students from a course when a class is removed from the course
 * this function goes into a before hook before we have to check whether there is a class missing
 * in the patch-body which was in the course before
 * @param hook - contains and request body
 */
const deleteWholeClassFromCourse = (hook) => {
	let requestBody = hook.data;
	let courseId = hook.id;
	return CourseModel.findById(courseId).exec().then(course => {
		if (!course) return hook;

		let removedClasses = _.differenceBy(course.classIds, requestBody.classIds, (v) => JSON.stringify(v));
		if (removedClasses.length < 1) return hook;
		return Promise.all(removedClasses.map(classId => {
			return ClassModel.findById(classId).exec().then(c =>  (c || []).userIds);
		})).then(studentIds => {
			// flatten deep arrays and remove duplicates
            studentIds = _.uniqWith(_.flattenDeep(studentIds), (e1, e2) => JSON.stringify(e1) === JSON.stringify(e2));

			// remove all students of classes from course, if they are in course
			return Promise.all(studentIds.map(s => {
				if (course.userIds.indexOf(s) >= 0) {
					return CourseModel.update({_id: course._id}, {$pull: {userIds: s}}).exec();
				} else {
					return {};
				}
			})).then(result => {

				// also remove all students from request body for not reading them in after hook
				requestBody.userIds = _.differenceBy(requestBody.userIds, studentIds, (v) => JSON.stringify(v));
				hook.data = requestBody;
				return hook;
			});
		});
	});
};

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [restrictToCurrentSchool],
	get: [],
	create: [],
	update: [restrictToCurrentSchool],
	patch: [restrictToCurrentSchool, deleteWholeClassFromCourse],
	remove: [restrictToCurrentSchool]
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
