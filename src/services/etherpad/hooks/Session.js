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

		// Collect all active sessions for this author
		const activeSessionIds = [];
		
		// Return existing session from hooks
		if (response?.data !== undefined && response.data !== null) {
			const responseData = response.data;
			const unixTimestamp = Number.parseInt(new Date(Date.now()).getTime() / 1000, 10);
			
			// Collect all valid active session IDs
			Object.keys(responseData)
				.forEach((sessionID) => {
					const sessionData = responseData[sessionID];
					const diffSeconds = sessionData.validUntil - unixTimestamp;
					if (diffSeconds > 0) {
						activeSessionIds.push(sessionID);
					}
				});

			const foundSessionID = Object.keys(responseData)
				.filter((sessionID) => responseData[sessionID] !== null && responseData[sessionID] !== undefined)
				.find((sessionID) => {
					const sessionData = responseData[sessionID];
					const diffSeconds = sessionData.validUntil - unixTimestamp;
					return (
						sessionData.groupID === context.data.groupID &&
						diffSeconds >= EtherpadClient.cookieReleaseThreshold
					);
				});
			let validUntil;
			if (foundSessionID !== undefined && foundSessionID !== null) {
				const respData = responseData[foundSessionID];
				({ validUntil } = respData);
			}
			context.data = {
				...context.data,
				sessionID: foundSessionID,
				validUntil,
			};
		}
		
		

		if (context.data.sessionID === undefined || context.data.sessionID === null) {
			const { cookieExpiresSeconds } = EtherpadClient;
			// add cookieExpiresSeconds to current date and convert to timestamp
			context.data.validUntil = Number.parseInt(new Date(Date.now()).getTime() / 1000, 10) + cookieExpiresSeconds;

			const sessionCreatePromise = EtherpadClient.createSession(context.data);
			const createResponse = await sessionCreatePromise;

			if (createResponse.data !== undefined && createResponse.data !== null) {
				const { sessionID } = createResponse.data;
				context.data = {
					...context.data,
					sessionID,
				};
				activeSessionIds.push(sessionID);
			}
		}

		context.data.activeSessionIds = activeSessionIds;

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
