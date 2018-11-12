'use strict';

const globalHooks = require('../../../hooks');
const auth = require('feathers-authentication');
const { canRead } = require('../utils/filePermissionHelper');


const restrictToCurrentUser = hook => {
	const { params: { account: { userId }}, result: {data: files}} = hook;
	const permissionPromises = files.map(f => {
		return canRead(userId, f)
			.then(() => f)
			.catch(() => undefined);
	});

	return Promise.all(permissionPromises)
		.then(allowedFiles => {
			hook.result.data = allowedFiles;
			return hook;
		});
};

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [globalHooks.hasPermission('FILESTORAGE_VIEW')],
	get: [globalHooks.hasPermission('FILESTORAGE_VIEW')],
	create: [globalHooks.hasPermission('FILESTORAGE_CREATE')],
	update: [globalHooks.hasPermission('FILESTORAGE_EDIT')],
	patch: [globalHooks.hasPermission('FILESTORAGE_EDIT')],
	remove: [globalHooks.hasPermission('FILESTORAGE_REMOVE')]
};

exports.after = {
	all: [],
	find: [restrictToCurrentUser],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: []
};
