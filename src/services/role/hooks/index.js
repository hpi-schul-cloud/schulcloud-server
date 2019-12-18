const { authenticate } = require('@feathersjs/authentication');
const feathersCache = require('@feathers-plus/cache');

const { resolveToIds, hasPermission, computeProperty } = require('../../../hooks');
const cacheSetup = require('../../helpers/cache');
const Role = require('../model');

const cacheMap = feathersCache({ max: 100 }); // Keep the 100 most recently used.
const { clearCacheAfterModified, sendFromCache, saveToCache } = cacheSetup(cacheMap, { logging: false });

exports.before = () => ({
	all: [
		authenticate('jwt'),
	],
	find: [
		sendFromCache,
	],
	get: [
		hasPermission('ROLE_VIEW'),
		sendFromCache,
	],
	create: [
		hasPermission('ROLE_CREATE'),
		resolveToIds.bind(this, '/roles', 'data.roles', 'name'),
	],
	update: [
		hasPermission('ROLE_EDIT'),
	],
	patch: [
		hasPermission('ROLE_EDIT'),
	],
	remove: [
		hasPermission('ROLE_CREATE'),
	],
});

exports.after = {
	all: [],
	find: [
		saveToCache,
	],
	get: [
		computeProperty(Role, 'getPermissions', 'permissions'),
		saveToCache,
	],
	create: [],
	update: [clearCacheAfterModified],
	patch: [clearCacheAfterModified],
	remove: [clearCacheAfterModified],
};
