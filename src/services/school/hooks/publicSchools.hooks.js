//	const { authenticate } = require('@feathersjs/authentication');

const { iff, isProvider, discard, disallow, keepInArray, keep } = require('feathers-hooks-common');
const globalHooks = require('../../../hooks');

const populateInQuery = (context) => (context.params.query || {}).$populate;

const isNotAuthenticated = async (context) => {
	if (typeof context.params.provider === 'undefined') {
		return false;
	}
	return !((context.params.headers || {}).authorization || (context.params.account && context.params.account.userId));
};

exports.before = {
	all: [],
	find: [],
	get: [],
	create: [disallow()],
	update: [disallow()],
	patch: [disallow()],
	remove: [disallow()],
};

exports.after = {
	all: [
		// todo: remove id if possible (shouldnt exist)
		iff(isNotAuthenticated, keep('name', 'purpose', 'systems', '_id', 'id', 'language', 'timezone')),
		iff(
			populateInQuery,
			keepInArray('systems', [
				'_id',
				'type',
				'alias',
				'ldapConfig.active',
				'ldapConfig.provider',
				'ldapConfig.rootPath',
			])
		),
		iff(isProvider('external') && !globalHooks.isSuperHero(), discard('storageProvider')),
	],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
