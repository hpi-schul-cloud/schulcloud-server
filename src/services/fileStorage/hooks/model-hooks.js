const { authenticate } = require('@feathersjs/authentication');
const { discard } = require('feathers-hooks-common');

const globalHooks = require('../../../hooks');
const { canRead } = require('../utils/filePermissionHelper');
const updateParentDirectories = require('../utils/updateParentDirectories');

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

const updateParents = async (hook) => {
	await updateParentDirectories(hook.id);
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
	get: [],
	create: [],
	update: [],
	patch: [updateParents],
	remove: [],
};
