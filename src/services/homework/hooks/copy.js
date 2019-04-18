const hooks = require('feathers-hooks-common');
const auth = require('@feathersjs/authentication');
const errors = require('@feathersjs/errors');
const globalHooks = require('../../../hooks');
const HomeworkModel = require('../model').homeworkModel;

const hasViewPermissionBefore = (hook) => {
	const { account } = hook.params;
	const homeworkId = hook.id || hook.data._id;

	return HomeworkModel.findOne({ _id: homeworkId }).exec()
		.then((res) => {
			if (res.teacherId.equals(account.userId)) {
				return Promise.resolve(hook);
			}
			return Promise.reject(new errors.Forbidden("The homework doesn't belong to you!"));
		});
};

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [hooks.disallow()],
	get: [
		globalHooks.hasPermission('HOMEWORK_VIEW'),
		globalHooks.hasPermission('HOMEWORK_CREATE'),
		hasViewPermissionBefore,
	],
	create: [
		globalHooks.injectUserId,
		globalHooks.hasPermission('HOMEWORK_VIEW'),
		globalHooks.hasPermission('HOMEWORK_CREATE'),
		hasViewPermissionBefore,
	],
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
