const auth = require('@feathersjs/authentication');
const hooks = require('feathers-hooks-common');

const globalHooks = require('../../../hooks');
const { fileStorageTypes } = require('../model');
const getFileStorageStrategy = require('../../fileStorage/strategies').createStrategy;

const _getDefaultFileStorageType = () => {
	if (!fileStorageTypes || !fileStorageTypes.length) {
		return void 0;
	}
	return fileStorageTypes[0];
};

const setDefaultFileStorageType = (hook) => {
	const storageType = _getDefaultFileStorageType();
	hook.data.fileStorageType = storageType;
	return Promise.resolve(hook);
};

const createDefaultStorageOptions = (hook) => {
	if (process.env.NODE_ENV !== 'production') {
		// don't create buckets in development or test
		return Promise.resolve(hook);
	}
	const storageType = _getDefaultFileStorageType();
	const schoolId = hook.result._id;
	const fileStorageStrategy = getFileStorageStrategy(storageType);
	return fileStorageStrategy.create(schoolId)
		.then(() => Promise.resolve(hook))
		.catch((err) => {
			if (err && err.code === 'BucketAlreadyOwnedByYou') {
				// The bucket already exists
				return Promise.resolve(hook);
			}
			return Promise.reject(err);
		});
};

exports.before = {
	all: [],
	find: [],
	get: [],
	create: [
		auth.hooks.authenticate('jwt'),
		globalHooks.hasPermission('SCHOOL_CREATE'),
		setDefaultFileStorageType,
	],
	update: [
		auth.hooks.authenticate('jwt'),
		globalHooks.hasPermission('SCHOOL_EDIT'),
	],
	patch: [
		auth.hooks.authenticate('jwt'),
		globalHooks.hasPermission('SCHOOL_EDIT'),
	],
	/* It is disabled for the moment, is added with new "Löschkonzept"
    remove: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('SCHOOL_CREATE')]
    */
	remove: [hooks.disallow()],
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [createDefaultStorageOptions],
	update: [createDefaultStorageOptions],
	patch: [createDefaultStorageOptions],
	remove: [],
};
