const { authenticate } = require('@feathersjs/authentication');
const { iff, isProvider } = require('feathers-hooks-common');
const { permitGroupOperation } = require('../../../hooks');
const globalHooks = require('../../../hooks');

const restrictToCurrentSchool = (context) => {
	const oldQuery = context.query || {};
	const systemids = context.params.school.systems || [];
	const newQuery = { $and: [oldQuery, { _id: { $in: systemids } }] };
	context.params.query = newQuery;
	return context;
};

exports.before = {
	all: [iff(isProvider('external'), [
		authenticate('jwt'),
		globalHooks.populateCurrentSchool,
		restrictToCurrentSchool,
	])],
	find: [],
	get: [],
	create: [iff(isProvider('external'), globalHooks.hasPermission('SYSTEM_CREATE'))],
	update: [iff(isProvider('external'), globalHooks.hasPermission('SYSTEM_EDIT'))],
	patch: [iff(isProvider('external'), [globalHooks.hasPermission('SYSTEM_EDIT'), permitGroupOperation])],
	remove: [iff(isProvider('external'), [globalHooks.hasPermission('SYSTEM_CREATE'), permitGroupOperation])],
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
