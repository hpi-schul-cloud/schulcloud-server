'use strict';

const globalHooks = require('../../../hooks');
const auth = require('@feathersjs/authentication');

const resolveUserId = (hook) => {
	hook.params.payload.userId = hook.params.account.userId ? hook.params.account.userId : '';
	return hook;
};

const resolveStorageType = (hook) => {
	let userService = hook.app.service("users");
	return userService.find({query: {
		_id: hook.params.payload.userId,
		$populate: ['schoolId']
	}}).then(res => {
		hook.params.payload.schoolId = res.data[0].schoolId._id;
		hook.params.payload.fileStorageType = res.data[0].schoolId.fileStorageType;
		return hook;
	});
};

exports.before = {
	all: [
		auth.hooks.authenticate('jwt'),
		globalHooks.injectUserId,
		resolveUserId,
		resolveStorageType
	],
	find: [globalHooks.hasPermission('FILESTORAGE_VIEW')],
	get: [globalHooks.hasPermission('FILESTORAGE_VIEW')],
	create: [globalHooks.hasPermission('FILESTORAGE_CREATE')],
	update: [globalHooks.hasPermission('FILESTORAGE_EDIT')],
	patch: [globalHooks.hasPermission('FILESTORAGE_EDIT')],
	remove: [globalHooks.hasPermission('FILESTORAGE_REMOVE')]
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
