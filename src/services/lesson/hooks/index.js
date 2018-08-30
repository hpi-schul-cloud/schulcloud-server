'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const lesson = require('../model');
const nanoid = require('nanoid');

const checkIfCourseGroupLesson = (permission1, permission2, isCreating, hook) => {
	// find courseGroupId in different ways (POST, FIND ...)
	let groupPromise = isCreating ? Promise.resolve({courseGroupId: hook.data.courseGroupId}) : lesson.findOne({_id: hook.id}).then(lesson => {
		return JSON.stringify(lesson.courseGroupId) ? globalHooks.hasPermission(permission1)(hook) : globalHooks.hasPermission(permission2)(hook);
	});
};

// add a shareToken to a lesson if course has a shareToken
const checkIfCourseShareable = (hook) => {
	const courseId = hook.result.courseId;
	const courseService = hook.app.service('courses');
	const lessonsService = hook.app.service('lessons');

	return courseService.get(courseId)
		.then(course => {
			if (!course.shareToken)
				return hook;

			return lesson.findByIdAndUpdate(hook.result._id, { shareToken: nanoid(12) })
				.then(lesson => {
					return hook;
				});
		});
};

exports.before = {
	all: [auth.hooks.authenticate('jwt'), (hook) => {
		if(hook.data && hook.data.contents) {
			hook.data.contents = (hook.data.contents || []).map((item) =>{
				item.user = item.user || hook.params.account.userId;
				return item;
			});
		}
		return hook;
	}],
	find: [globalHooks.hasPermission('TOPIC_VIEW')],
	get: [globalHooks.hasPermission('TOPIC_VIEW')],
	create: [checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_CREATE', 'TOPIC_CREATE', true), globalHooks.injectUserId, globalHooks.checkCorrectCourseId],
	update: [checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_EDIT', 'TOPIC_EDIT', false)],
	patch: [checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_EDIT', 'TOPIC_EDIT', false), globalHooks.permitGroupOperation, globalHooks.checkCorrectCourseId],
	remove: [checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_CREATE', 'TOPIC_CREATE', false), globalHooks.permitGroupOperation]
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [checkIfCourseShareable],
	update: [],
	patch: [],
	remove: []
};
