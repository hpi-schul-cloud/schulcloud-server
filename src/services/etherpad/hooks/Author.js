const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow } = require('feathers-hooks-common');

const { Forbidden } = require('../../../errors');
const { injectUserId, getUser } = require('../../../hooks');

const logger = require('../../../logger');

const getUserData = async (context) => {
	try {
		context.data = await getUser(context);
		return context;
	} catch (err) {
		logger.error('Failed to get user data', err);
		throw new Forbidden('Failed to get user data');
	}
};

const before = {
	all: [authenticate('jwt')],
	find: [disallow()],
	get: [disallow()],
	create: [injectUserId, getUserData],
	update: [disallow()],
	patch: [disallow()],
	remove: [disallow()],
};

const after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};

module.exports = {
	before,
	after,
};
