'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

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
	find: [],
	get: [],
	create: [],
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
