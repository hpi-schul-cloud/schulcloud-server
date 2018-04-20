'use strict';

const stripJs = require('strip-js');
const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const errors = require('feathers-errors');
const HomeworkModel = require('../model').homeworkModel;

const hasViewPermissionBefore = hook => {
	let account = hook.params.account;
	let homeworkId = hook.id;

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
	find: [hooks.disable()],
	get: [globalHooks.hasPermission('HOMEWORK_VIEW'), globalHooks.hasPermission('HOMEWORK_CREATE'), hasViewPermissionBefore],
	create: [hooks.disable()],
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
