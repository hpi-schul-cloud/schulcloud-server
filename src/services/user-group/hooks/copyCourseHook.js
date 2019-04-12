const hooks = require('feathers-hooks-common');
const auth = require('@feathersjs/authentication');
const _ = require('lodash');
const globalHooks = require('../../../hooks');

const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);

const injectCourseId = (hook) => {
	hook.data.courseId = hook.data._id;

	return hook;
};

exports.before = {
	all: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('USERGROUP_CREATE')],
	find: [hooks.disallow()],
	get: [hooks.disallow()],
	create: [globalHooks.injectUserId, injectCourseId, globalHooks.ifNotLocal(globalHooks.checkCorrectCourseOrTeamId)],
	update: [hooks.disallow()],
	patch: [hooks.disallow()],
	remove: [hooks.disallow()],
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};

exports.beforeShare = {
	all: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('USERGROUP_CREATE')],
	find: [],
	get: [globalHooks.ifNotLocal(globalHooks.checkCorrectCourseOrTeamId)],
	create: [globalHooks.injectUserId],
	update: [hooks.disallow()],
	patch: [hooks.disallow()],
	remove: [hooks.disallow()]
};
