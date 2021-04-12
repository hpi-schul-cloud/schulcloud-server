const { disallow } = require('feathers-hooks-common');
const { authenticate } = require('@feathersjs/authentication');
const { iff, isProvider } = require('feathers-hooks-common');

const { Forbidden } = require('../../../errors');
const { hasPermission, mapPayload, injectUserId } = require('../../../hooks');
const HomeworkModel = require('../model').homeworkModel;
const resolveStorageType = require('../../fileStorage/hooks/resolveStorageType');

const hasViewPermissionBefore = (context) => {
	const currentUser = context.params.account.userId.toString();
	const _id = context.id || context.data._id;

	return HomeworkModel.findOne({ _id })
		.lean()
		.exec()
		.then((homework) => {
			if (homework.teacherId.equals(currentUser)) {
				return context;
			}
			throw new Forbidden("The homework doesn't belong to you!");
		});
};

const convertResultToObject = (context) => {
	context.result = context.result.toObject();
};

exports.before = {
	all: [authenticate('jwt')],
	find: [disallow()],
	get: [
		hasPermission('HOMEWORK_VIEW'),
		hasPermission('HOMEWORK_CREATE'),
		hasViewPermissionBefore,
		mapPayload,
		resolveStorageType,
	],
	create: [
		injectUserId,
		iff(isProvider('external'), [
			hasPermission('HOMEWORK_VIEW'),
			hasPermission('HOMEWORK_CREATE'),
			hasViewPermissionBefore,
		]),
		mapPayload,
		resolveStorageType,
	],
	update: [disallow()],
	patch: [disallow()],
	remove: [disallow()],
};

exports.after = {
	all: [],
	find: [],
	get: [convertResultToObject],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
