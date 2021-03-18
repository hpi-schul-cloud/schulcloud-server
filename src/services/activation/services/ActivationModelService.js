const feathersMongooseService = require('feathers-mongoose');
const auth = require('@feathersjs/authentication');
const { iff, isProvider, disallow } = require('feathers-hooks-common');
const { activationModel } = require('../model');
const { enableQuery, enableQueryAfter } = require('../../../hooks');

const activationModelHooks = {
	before: {
		all: [auth.hooks.authenticate('jwt'), iff(isProvider('external'), disallow())],
		remove: [enableQuery],
	},
	after: {
		remove: [enableQueryAfter],
	},
};

const activationModelService = feathersMongooseService({
	Model: activationModel,
	paginate: false,
	lean: {
		virtuals: true,
	},
	multi: true,
});

module.exports = {
	activationModelHooks,
	activationModelService,
};
