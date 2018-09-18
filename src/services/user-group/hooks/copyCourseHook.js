'use strict';

const globalHooks = require('../../../hooks');
const auth = require('@feathersjs/authentication');
const _ = require('lodash');

const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);

const injectCourseId = (hook) => {
	hook.data.courseId = hook.data._id;

	return hook;
};

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [],
	get: [],
	create: [globalHooks.injectUserId, injectCourseId, globalHooks.ifNotLocal(globalHooks.checkCorrectCourseId)],
	update: [],
	patch: [],
	remove: []
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
