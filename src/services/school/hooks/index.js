const { authenticate } = require('@feathersjs/authentication');
const { Forbidden } = require('@feathersjs/errors');
const {
	iff, isProvider, discard, disallow, keepInArray,
} = require('feathers-hooks-common');
const logger = require('../../../logger');
const { equal } = require('../../../helper/compare').ObjectId;

const globalHooks = require('../../../hooks');
const { fileStorageTypes } = require('../model');
const getFileStorageStrategy = require('../../fileStorage/strategies').createStrategy;

const { yearModel: Year } = require('../model');
const SchoolYearFacade = require('../logic/year');

let years = null;

const expectYearsDefined = async () => {
	if (!years) {
		// default years will be cached after first call
		years = await Year.find().lean().exec();
	}
	return years;
};

const getDefaultFileStorageType = () => {
	if (!fileStorageTypes || !fileStorageTypes.length) {
		return undefined;
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
		await expectYearsDefined();
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
	await expectYearsDefined();
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

const updatesRocketChat = (key, data) => (key === '$push' || key === '$pull') && data[key].features === 'rocketChat';

const hasEditPermissions = async (context) => {
	try {
		const user = await globalHooks.getUser(context);
		if (user.permissions.includes('SCHOOL_EDIT')) {
			// SCHOOL_EDIT includes all of the more granular permissions below
			return context;
		}
		// if the user does not have SCHOOL_EDIT permissions, reduce the patch to the fields
		// the user is allowed to edit
		const patch = {};
		for (const key of Object.keys(context.data)) {
			if (user.permissions.includes('SCHOOL_CHAT_MANAGE') && updatesRocketChat(key, context.data)) {
				patch[key] = context.data[key];
			}
			if (user.permissions.includes('SCHOOL_LOGO_MANAGE') && key === 'logo_dataUrl') {
				patch[key] = context.data[key];
			}
		}
		context.data = patch;
		return context;
	} catch (err) {
		logger.error('Failed to check school edit permissions', err);
		throw new Forbidden('You don\'t have the necessary permissions to patch these fields');
	}
};

const restrictToUserSchool = async (context) => {
	const isSuperHero = await globalHooks.hasRole(context, context.params.account.userId, 'superhero');
	if (isSuperHero || equal(context.id, context.params.account.schoolId)) {
		return context;
	}
	throw new Forbidden('You can only edit your own school.');
};

const populateInQuery = (context) => (context.params.query || {}).$populate;

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
		globalHooks.ifNotLocal(globalHooks.lookupSchool),
		globalHooks.ifNotLocal(restrictToUserSchool),
	],
	patch: [
		authenticate('jwt'),
		globalHooks.ifNotLocal(hasEditPermissions),
		globalHooks.ifNotLocal(globalHooks.lookupSchool),
		globalHooks.ifNotLocal(restrictToUserSchool),
	],
	/* It is disabled for the moment, is added with new "Löschkonzept"
    remove: [authenticate('jwt'), globalHooks.hasPermission('SCHOOL_CREATE')]
    */
	remove: [disallow()],
};

exports.after = {
	all: [
		iff(populateInQuery, keepInArray('systems', ['_id', 'type', 'alias', 'ldapConfig.active'])),
		iff(isProvider('external'), discard('storageProvider')),
	],
	find: [decorateYears],
	get: [decorateYears],
	create: [createDefaultStorageOptions],
	update: [],
	patch: [],
	remove: [],
};
