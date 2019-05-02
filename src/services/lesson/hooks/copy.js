'use strict';

const auth = require('@feathersjs/authentication');
const errors = require('@feathersjs/errors');
const hooks = require('feathers-hooks-common');
const globalHooks = require('../../../hooks');
const lesson = require('../model');

const checkIfCourseGroupLesson = (permission1, permission2, isCreating, hook) => {
	// find courseGroupId in different ways (POST, FIND ...)
	let groupPromise = isCreating ? Promise.resolve({courseGroupId: hook.data.courseGroupId}) : lesson.findOne({_id: hook.id}).then(lesson => {
		return JSON.stringify(lesson.courseGroupId) ? globalHooks.hasPermission(permission1)(hook) : globalHooks.hasPermission(permission2)(hook);
	});
};

const checkForShareToken = (hook) => {
	const {shareToken, lessonId} = hook.data;

	return lesson.findOne({_id: lessonId}).populate('courseId')
		.then(topic => {
			if ((topic.shareToken == shareToken && shareToken != undefined) || topic.courseId.teacherIds.filter(t => t.toString() == hook.params.account.userId).length > 0)
				return hook;
			else
				throw new errors.Forbidden("The entered lesson doesn't belong to you or is not allowed to be shared!");
		});
};

exports.before = () => ({
	all: [auth.hooks.authenticate('jwt')],
	find: [hooks.disallow()],
	get: [hooks.disallow()],
	create: [
		checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_CREATE', 'TOPIC_CREATE', true),
		globalHooks.injectUserId,
		checkForShareToken,
	],
	update: [hooks.disallow()],
	patch: [hooks.disallow()],
	remove: [hooks.disallow()],
});
