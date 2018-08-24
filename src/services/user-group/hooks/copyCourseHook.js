'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const _ = require('lodash');

const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);

const injectCourseId = (hook) => {
	hook.data.courseId = hook.data._id;

	return hook;
};

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [hooks.disable()],
	get: [hooks.disable()],
	create: [globalHooks.injectUserId, injectCourseId, globalHooks.ifNotLocal(globalHooks.checkCorrectCourseId)],
	update: [hooks.disable()],
	patch: [hooks.disable()],
	remove: [hooks.disable()]
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: []
};
