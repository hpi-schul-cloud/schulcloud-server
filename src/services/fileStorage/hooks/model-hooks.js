const { authenticate } = require('@feathersjs/authentication');
const { discard } = require('feathers-hooks-common');

const globalHooks = require('../../../hooks');
const { canRead } = require('../utils/filePermissionHelper');

const { Forbidden } = require('../../../errors');

const restrictToCurrentUser = (hook) => {
	const {
		params: {
			account: { userId },
		},
		result: { data: files },
	} = hook;
	const permissionPromises = files.map((f) =>
		canRead(userId, f)
			.then(() => f)
			.catch(() => undefined)
	);

	return Promise.all(permissionPromises).then((allowedFiles) => {
		hook.result.data = allowedFiles;
		return hook;
	});
};

const handleShareCode = (hook) => {
	if (hook.params.query.shareToken && hook.result.shareToken !== hook.params.query.shareToken) {
		if (hook.params === undefined) {
			throw new Forbidden('hook.params');
		}
		if (hook.params.query === undefined) {
			throw new Forbidden('hook.params.query === undefined');
		}
		if (hook.params.query.shareToken === undefined) {
			throw new Forbidden('hook.params.query.shareToken === undefined');
		}
		if (hook.result === undefined) {
			throw new Forbidden('hook.result === undefined');
		}
		if (hook.result.shareToken === undefined) {
			throw new Forbidden(JSON.stringify(hook.result).replace(/['"]/gim, '-'));
		}
		throw new Forbidden('Invalid share token.');
	}
	return hook;
};

exports.before = {
	all: [authenticate('jwt')],
	find: [globalHooks.hasPermission('FILESTORAGE_VIEW')],
	get: [globalHooks.hasPermission('FILESTORAGE_VIEW')],
	create: [globalHooks.hasPermission('FILESTORAGE_CREATE')],
	update: [globalHooks.hasPermission('FILESTORAGE_EDIT')],
	patch: [globalHooks.hasPermission('FILESTORAGE_EDIT')],
	remove: [globalHooks.hasPermission('FILESTORAGE_REMOVE')],
};

exports.after = {
	all: [discard('securityCheck.requestToken', 'thumbnailRequestToken')],
	find: [restrictToCurrentUser],
	get: [handleShareCode],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
