const { authenticate } = require('@feathersjs/authentication');
const hooks = require('feathers-hooks-common');
const { transformToDataTransferObject } = require('../../../hooks');

const before = {
	all: [],
	find: [authenticate('jwt')],
	get: [hooks.disallow()],
	create: [hooks.disallow()],
	update: [hooks.disallow()],
	patch: [hooks.disallow()],
	remove: [hooks.disallow()],
};

const after = {
	all: [],
	find: [transformToDataTransferObject],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
