const { authenticate } = require('@feathersjs/authentication');
const { iff, isProvider, discard } = require('feathers-hooks-common');

const { Forbidden } = require('../../../errors');
const { permitGroupOperation } = require('../../../hooks');
const { ObjectId } = require('../../../helper/compare');
const globalHooks = require('../../../hooks');
const { encryptSecret, decryptSecret } = require('./searchUserPasswordEncryption');
const verifyPayload = require('./verifyPayload');

const restrictToCurrentSchool = (context) => {
	const systemids = context.params.school.systems || [];
	if (context.id) {
		const schoolSystem = systemids.some((s) => ObjectId.equal(s, context.id));
		if (schoolSystem) {
			return context;
		}
		throw new Forbidden('You are not allowed to access this system.');
	}
	const oldQuery = context.query || {};
	const newQuery = { $and: [oldQuery, { _id: { $in: systemids } }] };
	context.params.query = newQuery;
	return context;
};

const addSystemToSchool = async (context) => {
	const system = context.result;
	const { school } = context.params;

	await context.app.service('schools').patch(school._id, { $push: { systems: system._id } });
	return context;
};

const removeSystemFromSchool = async (context) => {
	const system = context.result;
	const { school } = context.params;

	await context.app.service('schools').patch(school._id, { $pull: { systems: system._id } });

	return context;
};

exports.before = {
	all: [iff(isProvider('external'), [authenticate('jwt'), globalHooks.populateCurrentSchool, restrictToCurrentSchool])],
	find: [iff(isProvider('external'), globalHooks.hasPermission('SYSTEM_EDIT'))],
	get: [iff(isProvider('external'), globalHooks.hasPermission('SYSTEM_EDIT'))],
	create: [iff(isProvider('external'), globalHooks.hasPermission('SYSTEM_CREATE')), encryptSecret],
	update: [
		iff(isProvider('external'), [globalHooks.hasPermission('SYSTEM_EDIT'), permitGroupOperation, verifyPayload]),
		encryptSecret,
	],
	patch: [
		iff(isProvider('external'), [globalHooks.hasPermission('SYSTEM_EDIT'), permitGroupOperation, verifyPayload]),
		encryptSecret,
	],
	remove: [
		iff(isProvider('external'), [globalHooks.hasPermission('SYSTEM_CREATE'), permitGroupOperation, verifyPayload]),
	],
};

exports.after = {
	all: [iff(isProvider('external'), [discard('ldapConfig.searchUserPassword')])],
	find: [decryptSecret],
	get: [decryptSecret],
	create: [iff(isProvider('external'), [addSystemToSchool])],
	update: [],
	patch: [],
	remove: [iff(isProvider('external'), [removeSystemFromSchool])],
};
