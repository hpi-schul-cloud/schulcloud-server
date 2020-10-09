const hooks = require('feathers-hooks-common');
const { authenticate } = require('@feathersjs/authentication');
const reqlib = require('app-root-path').require;

const { Forbidden, BadRequest } = reqlib('src/errors');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;
const { TEAM_FEATURES } = require('../../teams/model');

const userIsInTeam = (userId, team) => {
	const user = team.userIds.find((el) => equalIds(el.userId, userId));
	return user !== undefined;
};

const checkTeam = async (hook) => {
	const team = await hook.app.service('teams').get(hook.id);
	if (!team.features.includes(TEAM_FEATURES.ROCKET_CHAT)) {
		throw new BadRequest('rocket.chat is disabled for this team');
	}
	if (typeof hook.params.provider !== 'undefined' && !userIsInTeam(hook.params.account.userId, team)) {
		throw new Forbidden('you are not in this team');
	}
	return hook;
};

const rocketChatUserHooks = {
	before: {
		all: [authenticate('jwt')],
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
		all: [authenticate('jwt')],
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
		all: [authenticate('jwt')],
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
		all: [authenticate('jwt')],
		find: [hooks.disallow()],
		get: [checkTeam],
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
