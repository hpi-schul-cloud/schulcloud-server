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

const getSessionInformation = async (context) => {
	const sessionListPromise = EtherpadClient.getActiveSessions({ authorID: context.data.authorID });
	try {
		const response = await sessionListPromise;
		// Return existing session from hooks
		if (response && typeof response.data !== 'undefined' && response.data !== null) {
			const responseData = response.data;
			const unixTimestamp = parseInt(new Date(Date.now()).getTime() / 1000, 10);
			const foundSessionID = Object.keys(responseData)
				.filter((sessionID) => responseData[sessionID] !== null && typeof responseData[sessionID] !== 'undefined')
				.find((sessionID) => {
					const diffSeconds = responseData[sessionID].validUntil - unixTimestamp;
					return (
						responseData[sessionID].groupID === context.data.groupID &&
						diffSeconds >= EtherpadClient.cookieReleaseThreshold
					);
				});
			let validUntil;
			if (typeof foundSessionID !== 'undefined' && foundSessionID !== null) {
				const respData = responseData[foundSessionID];
				({ validUntil } = respData);
			}
			context.data = {
				...context.data,
				sessionID: foundSessionID,
				validUntil,
			};
		}

		if (typeof context.data.sessionID === 'undefined' || context.data.sessionID === null) {
			const { cookieExpiresSeconds } = EtherpadClient;
			// add cookieExpiresSeconds to current date and convert to timestamp
			context.data.validUntil = parseInt(new Date(Date.now()).getTime() / 1000, 10) + cookieExpiresSeconds;

			const sessionCreatePromise = EtherpadClient.createSession(context.data);
			const createResponse = await sessionCreatePromise;

			if (typeof createResponse.data !== 'undefined' && createResponse.data !== null) {
				context.data = {
					...context.data,
					sessionID: createResponse.data.sessionID,
				};
			}
		}

		return context;
	} catch (err) {
		logger.error('Failed to get sessions data: ', err);
		throw new Forbidden('Failed to get sessions data');
	}
};

const before = {
	all: [authenticate('jwt')],
	find: [disallow()],
	get: [disallow()],
	create: [getAuthorData, getGroupData, getSessionInformation],
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
