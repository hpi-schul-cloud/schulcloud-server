'use strict';

const stripJs = require('strip-js');
const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const errors = require('feathers-errors');

const createCopy = hook => {
	let assignment = JSON.parse(JSON.stringify(hook.result));
	// sanitize before copy
	delete assignment._id;
	delete assignment.stats;
	delete assignment.isTeacher;
	delete assignment.archived;
	delete assignment.__v;
	if(assignment.courseId){
		if((assignment.courseId||{})._id){
			assignment.courseId = assignment.courseId._id;
		}
	}else{
		delete assignment.courseId
	}
	assignment.private = true;

	// post copied task
	const homeworkService = hook.app.service('/homework');
	return homeworkService.create(assignment).then((newAssignment) => {
		hook.result = newAssignment;
		return Promise.resolve(hook);
	}).catch(err => {
		return Promise.reject(new errors.GeneralError(err));
	})
};

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [globalHooks.hasPermission('HOMEWORK_VIEW')],
	get: [globalHooks.hasPermission('HOMEWORK_CREATE')],
	create: [globalHooks.hasPermission('HOMEWORK_CREATE')],
	update: [globalHooks.hasPermission('HOMEWORK_EDIT')],
	patch: [globalHooks.hasPermission('HOMEWORK_EDIT'),globalHooks.permitGroupOperation],
	remove: [globalHooks.hasPermission('HOMEWORK_CREATE'),globalHooks.permitGroupOperation]
};

exports.after = {
	all: [],
	find: [],
	get: [createCopy],
	create: [],
	update: [],
	patch: [],
	remove: []
};
