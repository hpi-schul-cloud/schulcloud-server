const { authenticate } = require('@feathersjs/authentication');
const { hasPermission, injectUserId, mapPayload } = require('../../../hooks');
const resolveStorageType = require('./resolveStorageType');
const { excludeAttributesFromSanitization } = require('../../../hooks/sanitizationExceptions');

const resolveUserId = (hook) => {
	// local workaround if authentication is disabled
	hook.params.payload = hook.params.payload || (hook.data || {}).userPayload || {};
	hook.params.account = hook.params.account || hook.data.account;
	hook.params.payload.userId = hook.params.account.userId || '';

	return hook;
};

exports.before = {
	all: [authenticate('jwt'), mapPayload, injectUserId, resolveUserId, resolveStorageType],
	find: [hasPermission('FILESTORAGE_VIEW')],
	get: [hasPermission('FILESTORAGE_VIEW')],
	create: [hasPermission('FILESTORAGE_CREATE')],
	update: [hasPermission('FILESTORAGE_EDIT')],
	patch: [hasPermission('FILESTORAGE_EDIT')],
	remove: [hasPermission('FILESTORAGE_REMOVE')],
};

const signedUrlPath = 'fileStorage/signedUrl';

exports.after = {
	all: [],
	find: [excludeAttributesFromSanitization(signedUrlPath, ['url'])],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
