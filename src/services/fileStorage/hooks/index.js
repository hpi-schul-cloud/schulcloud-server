const auth = require('@feathersjs/authentication');
const { hasPermission, injectUserId } = require('../../../hooks');
const resolveStorageType = require('./resolveStorageType');

const resolveUserId = (hook) => {
	// local workaround if authentication is disabled
	hook.params.payload = hook.params.payload || (hook.data || {}).userPayload || {};
	hook.params.account = hook.params.account || hook.data.account;
	hook.params.payload.userId = hook.params.account.userId || '';

	return hook;
};

exports.before = {
	all: [
		auth.hooks.authenticate('jwt'),
		injectUserId,
		resolveUserId,
		resolveStorageType,
	],
	find: [hasPermission('FILESTORAGE_VIEW')],
	get: [hasPermission('FILESTORAGE_VIEW')],
	create: [hasPermission('FILESTORAGE_CREATE')],
	update: [hasPermission('FILESTORAGE_EDIT')],
	patch: [hasPermission('FILESTORAGE_EDIT')],
	remove: [hasPermission('FILESTORAGE_REMOVE')],
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
