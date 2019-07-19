const auth = require('@feathersjs/authentication');
const hooks = require('feathers-hooks-common');
const logger = require('../../../logger');

const globalHooks = require('../../../hooks');
const { fileStorageTypes } = require('../model');
const getFileStorageStrategy = require('../../fileStorage/strategies').createStrategy;

const { yearModel: Year } = require('../model');
const SchoolYearFacade = require('../logic/year');

let years = null;

const getDefaultFileStorageType = () => {
	if (!fileStorageTypes || !fileStorageTypes.length) {
		return void 0;
	}
	return fileStorageTypes[0];
};

const setDefaultFileStorageType = (hook) => {
	const storageType = getDefaultFileStorageType();
	hook.data.fileStorageType = storageType;
	return Promise.resolve(hook);
};

const createDefaultStorageOptions = (hook) => {
	if (process.env.NODE_ENV !== 'production') {
		// don't create buckets in development or test
		return Promise.resolve(hook);
	}
	const storageType = getDefaultFileStorageType();
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


const decorateYears = async (hook) => {
	if (!years) {
		years = await Year.find().lean().exec();
	}
	try {
		hook.result.data.forEach((school) => {
			const facade = new SchoolYearFacade(years, school);
			school.years = facade.data;
		});
	} catch (error) {
		logger.error(error);
	}
	return hook;
};

// fixme: resdtrict to current school
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
	find: [decorateYears],
	get: [decorateYears],
	create: [createDefaultStorageOptions],
	update: [createDefaultStorageOptions],
	patch: [createDefaultStorageOptions],
	remove: [],
};
