'use strict';

const globalHooks = require('../../../hooks');
const auth = require('@feathersjs/authentication');
const errors = require('@feathersjs/errors');
const HomeworkModel = require('../model').homeworkModel;

const hasViewPermissionBefore = hook => {
	let account = hook.params.account;
	let homeworkId = hook.id || hook.data._id;

	return HomeworkModel.findOne({_id: homeworkId}).exec()
		.then(res => {
			if (res.teacherId.equals(account.userId))
				return Promise.resolve(hook);
			else {
				return Promise.reject(new errors.Forbidden("The homework doesn't belong to you!"));
			}
		});
};

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [],
	get: [globalHooks.hasPermission('HOMEWORK_VIEW'), globalHooks.hasPermission('HOMEWORK_CREATE'), hasViewPermissionBefore],
	create: [globalHooks.injectUserId, globalHooks.hasPermission('HOMEWORK_VIEW'), globalHooks.hasPermission('HOMEWORK_CREATE'), hasViewPermissionBefore],
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
