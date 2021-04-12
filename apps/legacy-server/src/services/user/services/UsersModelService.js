const feathersMongooseService = require('feathers-mongoose');
const auth = require('@feathersjs/authentication');
const { iff, isProvider, disallow } = require('feathers-hooks-common');
const { userModel } = require('../model');
const { addDates: addConsentDate } = require('../hooks/consent');
const { enableQuery, enableQueryAfter, resolveToIds } = require('../../../hooks');

const userModelHooks = {
	before: {
		all: [auth.hooks.authenticate('jwt'), iff(isProvider('external'), disallow())],
		create: [resolveToIds('/roles', 'data.roles', 'name'), addConsentDate],
		update: [addConsentDate],
		patch: [addConsentDate],
		remove: [enableQuery],
		find: [resolveToIds('/roles', 'params.query.roles', 'name')],
	},
	after: {
		remove: [enableQueryAfter],
	},
};

const userModelService = feathersMongooseService({
	Model: userModel,
	paginate: {
		default: 1000,
		max: 5000,
	},
	lean: {
		virtuals: true,
	},
	multi: true,
	whitelist: ['$exists', '$elemMatch', '$regex', '$skip', '$populate', '$nor'],
});

module.exports = {
	userModelService,
	userModelHooks,
};
