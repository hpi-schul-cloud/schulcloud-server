'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

const fileStorageTypes = require('../model').fileStorageTypes;
const getFileStorageStrategy = require('../../fileStorage/strategies').createStrategy;

const _getDefaultFileStorageType = () => {
	if (!fileStorageTypes || !fileStorageTypes.length) {
		return void 0;
	}
	return fileStorageTypes[0];
};

const setDefaultFileStorageType = (hook) => {
	const storageType = _getDefaultFileStorageType();
	hook.data['fileStorageType'] = storageType;
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
		.then(() => {
			return Promise.resolve(hook);
		})
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
	create: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('SCHOOL_CREATE'), setDefaultFileStorageType],
	update: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('SCHOOL_EDIT')],
	patch: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('SCHOOL_EDIT')],
	remove: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('SCHOOL_CREATE')]
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [createDefaultStorageOptions],
	update: [createDefaultStorageOptions],
	patch: [createDefaultStorageOptions],
	remove: []
};
