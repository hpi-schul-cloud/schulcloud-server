const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow } = require('feathers-hooks-common');

const { Forbidden } = require('../../../errors');
const EtherpadClient = require('../utils/EtherpadClient');

const logger = require('../../../logger');

const getAuthorData = async (context) => {
	const authorService = context.app.service('etherpad/authors').create({ userId: context.params.account.userId });
	try {
		const response = await authorService;
		context.data = {
			...context.data,
			authorID: response.data.authorID,
		};
		return context;
	} catch (err) {
		logger.error('Failed to get author data: ', err);
		throw new Forbidden('Failed to get author data');
	}
};

const getGroupData = async (context) => {
	context.data = {
		...context.data,
		userId: context.params.account.userId,
	};
	const groupService = context.app.service('etherpad/groups').create(context.data);
	try {
		const response = await groupService;
		context.data = {
			...context.data,
			groupID: response.data.groupID,
		};
		return context;
	} catch (err) {
		logger.error('Failed to get course data: ', err);
		throw new Forbidden('Failed to get course data');
	}
};

const getActiveSessions = async (context) => {
	try {
		const response = await EtherpadClient.getActiveSessions({ authorID: context.data.authorID });
		// Return existing session from hooks
		if (response?.data !== undefined && response.data !== null) {
			const responseData = response.data;
			const sessionIDs = Object.keys(responseData)
				
			context.data = {
				...context.data,
				sessionIDs,
			};
		}

		return context;
	} catch (err) {
		logger.error('Failed to get active sessions data: ', err);
		throw new Forbidden('Failed to get active sessions data');
	}
};

const before = {
	all: [authenticate('jwt')],
	find: [getAuthorData, getGroupData, getActiveSessions],
	get: [getAuthorData, getGroupData, getActiveSessions],
	create: [disallow()],
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
