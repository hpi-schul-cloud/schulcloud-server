const logger = require('../../../logger');
const hooks = require('feathers-hooks-common');
const auth = require('@feathersjs/authentication');
const { Forbidden, BadRequest } = require('@feathersjs/errors');

const globalHooks = require('../../../hooks');


const userIsInTeam = (userId, team) => {
	const user = team.userIds.find(el => el.userId.toString() === userId.toString());
	return (user !== undefined);
};

const checkTeam = async (hook) => {
	const team = await hook.app.service('teams').get(hook.id);
	if (!team.features.includes('rocketChat')) {
		throw new BadRequest('rocket.chat is disabled for this team');
	}
	if (typeof (hook.params.provider) !== 'undefined' && !userIsInTeam(hook.params.account.userId, team)) {
		throw new Forbidden('you are not in this team');
	}
	return hook;
};

const ensureCurrentUserInChannel = (hook) => {
	hook.app.service('rocketChat/channel').addUsersToChannel([hook.params.account.userId], hook.id)
		.catch(err => logger.warn(err));
	return hook;
};

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
		get: [checkTeam, globalHooks.ifNotLocal(ensureCurrentUserInChannel)],
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
