const hooks = require('feathers-hooks-common');
const { authenticate } = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');

const injectCourseId = (hook) => {
	hook.data.courseId = hook.data._id;

	return hook;
};

exports.before = {
	all: [authenticate('jwt'), globalHooks.hasPermission('COURSE_CREATE')],
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
	all: [authenticate('jwt'), globalHooks.hasPermission('COURSE_CREATE')],
	find: [],
	get: [globalHooks.ifNotLocal(globalHooks.checkCorrectCourseOrTeamId)],
	create: [globalHooks.injectUserId],
	update: [hooks.disallow()],
	patch: [hooks.disallow()],
	remove: [hooks.disallow()],
};
