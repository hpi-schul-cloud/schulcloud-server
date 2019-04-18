const hooks = require('feathers-hooks-common');
const auth = require('@feathersjs/authentication');

const rocketChatUserHooks = {
	before: {
		all: [auth.hooks.authenticate('jwt')],
		find: [],
		get: [],
		create: [hooks.disallow()],
		update: [hooks.disallow()],
		patch: [hooks.disallow()],
		remove: [hooks.disallow()],
	},
	after: {
		all: [],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: [],
	},
};

const rocketChatLoginHooks = {
	before: {
		all: [auth.hooks.authenticate('jwt')],
		find: [hooks.disallow()],
		get: [],
		create: [hooks.disallow()],
		update: [hooks.disallow()],
		patch: [hooks.disallow()],
		remove: [hooks.disallow()],
	},
	after: {
		all: [],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: [],
	},
};

const rocketChatLogoutHooks = {
	before: {
		all: [auth.hooks.authenticate('jwt')],
		find: [hooks.disallow()],
		get: [],
		create: [hooks.disallow()],
		update: [hooks.disallow()],
		patch: [hooks.disallow()],
		remove: [hooks.disallow()],
	},
	after: {
		all: [],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: [],
	},
};

const rocketChatChannelHooks = {
	before: {
		all: [auth.hooks.authenticate('jwt')],
		find: [hooks.disallow()],
		get: [],
		create: [hooks.disallow()],
		update: [hooks.disallow()],
		patch: [hooks.disallow()],
		remove: [hooks.disallow()],
	},
	after: {
		all: [],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: [],
	},
};

module.exports = {
	rocketChatUserHooks,
	rocketChatLoginHooks,
	rocketChatLogoutHooks,
	rocketChatChannelHooks,
};
