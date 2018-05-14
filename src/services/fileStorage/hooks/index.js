'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

const resolveUserId = (hook) => {
	// local workaround if authentication is disabled
	hook.params.payload = hook.params.payload || hook.data.userPayload;
	hook.params.account = hook.params.account || hook.data.account;

	hook.params.payload.userId = hook.params.account.userId || '';
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
