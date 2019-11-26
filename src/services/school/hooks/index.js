const { authenticate } = require('@feathersjs/authentication');
const hooks = require('feathers-hooks-common');
const logger = require('../../../logger');

const globalHooks = require('../../../hooks');
const { fileStorageTypes } = require('../model');
const getFileStorageStrategy = require('../../fileStorage/strategies').createStrategy;

const { yearModel: Year } = require('../model');
const SchoolYearFacade = require('../logic/year');

let years = null;

const extpectYearsDefined = async () => {
	if (!years) {
		// default years will be cached after first call
		years = await Year.find().lean().exec();
	}
	return years;
};

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

const setCurrentYearIfMissing = async (hook) => {
	if (!hook.data.currentYear) {
		await extpectYearsDefined();
		const facade = new SchoolYearFacade(years, hook.data);
		hook.data.currentYear = facade.defaultYear;
	}
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


const decorateYears = async (context) => {
	await extpectYearsDefined();
	const addYearsToSchool = (school) => {
		const facade = new SchoolYearFacade(years, school);
		school.years = facade.toJSON();
	};
	try {
		switch (context.method) {
			case 'find':
				context.result.data.forEach((school) => {
					addYearsToSchool(school);
				});
				break;
			case 'get':
				addYearsToSchool(context.result);
				break;
			default:
				throw new Error('method not supported');
		}
	} catch (error) {
		logger.error(error);
	}
	return context;
};

// fixme: resdtrict to current school
exports.before = {
	all: [],
	find: [],
	get: [],
	create: [
		authenticate('jwt'),
		globalHooks.hasPermission('SCHOOL_CREATE'),
		setDefaultFileStorageType,
		setCurrentYearIfMissing,
	],
	update: [
		authenticate('jwt'),
		globalHooks.hasPermission('SCHOOL_EDIT'),
	],
	patch: [
		authenticate('jwt'),
		globalHooks.hasPermission('SCHOOL_EDIT'),
	],
	/* It is disabled for the moment, is added with new "Löschkonzept"
    remove: [authenticate('jwt'), globalHooks.hasPermission('SCHOOL_CREATE')]
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
