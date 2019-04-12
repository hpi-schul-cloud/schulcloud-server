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
	all: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('USERGROUP_CREATE')],
	find: [hooks.disable()],
	get: [hooks.disable()],
	create: [globalHooks.injectUserId, injectCourseId, globalHooks.ifNotLocal(globalHooks.checkCorrectCourseOrTeamId)],
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

exports.beforeShare = {
	all: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('USERGROUP_CREATE')],
	find: [],
	get: [globalHooks.ifNotLocal(globalHooks.checkCorrectCourseOrTeamId)],
	create: [globalHooks.injectUserId],
	update: [hooks.disable()],
	patch: [hooks.disable()],
	remove: [hooks.disable()]
};
