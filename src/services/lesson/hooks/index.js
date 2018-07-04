'use strict';

const globalHooks = require('../../../hooks');
const stripJs = require('strip-js');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const lesson = require('../model');

const checkIfCourseGroupLesson = (permission1, permission2, isCreating, hook) => {
	// find courseGroupId in different ways (POST, FIND ...)
	let groupPromise = isCreating ? Promise.resolve({courseGroupId: hook.data.courseGroupId}) : lesson.findOne({_id: hook.id}).then(lesson => {
		return JSON.stringify(lesson.courseGroupId) ? globalHooks.hasPermission(permission1)(hook) : globalHooks.hasPermission(permission2)(hook);
	});
};

exports.before = {
	all: [auth.hooks.authenticate('jwt'), (hook) => {
		if(hook.data && hook.data.contents) {
			hook.data.contents = (hook.data.contents || []).map((item) =>{
				item.user = item.user || hook.params.account.userId;
				switch (item.component) {
					case 'text':
						if (item.content && item.content.text) {
							item.content.text = stripJs(item.content.text);
						}
						break;
				}
				return item;
			});
		}
		return hook;
	}],
	find: [globalHooks.hasPermission('TOPIC_VIEW')],
	get: [globalHooks.hasPermission('TOPIC_VIEW')],
	create: [checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_CREATE', 'TOPIC_CREATE', true), globalHooks.checkCorrectCourseId],
	update: [checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_EDIT', 'TOPIC_EDIT', false)],
	patch: [checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_EDIT', 'TOPIC_EDIT', false), globalHooks.permitGroupOperation, globalHooks.checkCorrectCourseId],
	remove: [checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_CREATE', 'TOPIC_CREATE', false), globalHooks.permitGroupOperation]
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
