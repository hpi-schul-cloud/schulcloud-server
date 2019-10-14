const hooks = require('feathers-hooks-common');
const auth = require('@feathersjs/authentication');
const { Forbidden } = require('@feathersjs/errors');
const globalHooks = require('../../../hooks');
const HomeworkModel = require('../model').homeworkModel;

const hasViewPermissionBefore = (context) => {
	const currentUser = context.params.account.userId.toString();
	const _id = context.id || context.data._id;

	return HomeworkModel.findOne({ _id }).lean().exec()
		.then((homework) => {
			if (homework.teacherId.equals(currentUser)) {
				return context;
			}
			throw new Forbidden("The homework doesn't belong to you!");
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
