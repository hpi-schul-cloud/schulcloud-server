const { Configuration } = require('@hpi-schul-cloud/commons');
const { getChannel } = require('../../utils/rabbitmq');
const { ACTIONS, requestSyncForEachSchoolUser, requestRemovalOfRemovedRooms } = require('./producer');
const {
	buildAddUserMessage,
	buildDeleteUserMessage,
	buildAddCourseMessage,
	buildDeleteCourseMessage,
	buildAddTeamMessage,
	buildDeleteTeamMessage,
	expandContentIds,
	messengerIsActivatedForSchool,
} = require('./utils');
const logger = require('../../logger');
const { ObjectId } = require('../../helper/compare');

let channelSendExternal;
let channelReadInternal;

const validateMessage = (content) => {
	const errorMsg = `MESSENGER SYNC: invalid message in queue ${Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL')}`;
	// action
	if (!content.action) {
		logger.error(`${errorMsg}, action missing.`, content);
		return false;
	}

	switch (content.action) {
		case ACTIONS.SYNC_SCHOOL: {
			if (!content.schoolId) {
				logger.error(`${errorMsg}, schoolId is required for ${ACTIONS.SYNC_SCHOOL}.`, content);
				return false;
			}

			if (!ObjectId.isValid(content.schoolId)) {
				logger.error(`${errorMsg}, invalid schoolId.`, content);
				return false;
			}

			if (!content.fullSync) {
				logger.error(`${errorMsg}, fullSync flag has to be set for ${ACTIONS.SYNC_SCHOOL}.`, content);
				return false;
			}
			return true;
		}

		case ACTIONS.SYNC_USER: {
			if (!content.userId) {
				logger.error(`${errorMsg}, userId is required for ${ACTIONS.SYNC_USER}.`, content);
				return false;
			}

			if (!ObjectId.isValid(content.userId)) {
				logger.error(`${errorMsg}, invalid userId.`, content);
				return false;
			}

			if (!content.courses && !content.teams && !content.fullSync) {
				logger.error(`${errorMsg}, one of fullSync/courses/teams has to be provided to sync a user.`, content);
				return false;
			}
			return true;
		}

		case ACTIONS.DELETE_USER: {
			if (!content.userId) {
				logger.error(`${errorMsg}, userId is required for ${ACTIONS.DELETE_USER}.`, content);
				return false;
			}

			if (!ObjectId.isValid(content.userId)) {
				logger.error(`${errorMsg}, invalid userId.`, content);
				return false;
			}
			return true;
		}

		case ACTIONS.SYNC_COURSE:
		case ACTIONS.DELETE_COURSE: {
			if (!content.courseId) {
				logger.error(`${errorMsg}, courseId is required for:`, content);
				return false;
			}

			if (!ObjectId.isValid(content.courseId)) {
				logger.error(`${errorMsg}, invalid courseId.`, content);
				return false;
			}
			return true;
		}

		case ACTIONS.SYNC_TEAM:
		case ACTIONS.DELETE_TEAM: {
			if (!content.teamId) {
				logger.error(`${errorMsg}, teamId is required for:`, content);
				return false;
			}

			if (!ObjectId.isValid(content.teamId)) {
				logger.error(`${errorMsg}, invalid teamId.`, content);
				return false;
			}
			return true;
		}

		default: {
			logger.error(`${errorMsg}, invalid action.`, content);
			// message can't be processed
			return false;
		}
	}
};

const sendToExternalQueue = (mxId, message) => {
	channelSendExternal[mxId].sendToQueue(message, { persistent: true });
};

const executeMessage = async (incomingMessage) => {
	const content = JSON.parse(incomingMessage.content.toString());

	if (!validateMessage(content)) {
		// message is invalid an can not be retried
		return false;
	}

	await expandContentIds(content);
	if (!messengerIsActivatedForSchool(content.school)) {
		// school should not be synced
		return false;
	}

	switch (content.action) {
		case ACTIONS.SYNC_SCHOOL: {
			await requestSyncForEachSchoolUser(content.schoolId);
			await requestRemovalOfRemovedRooms(content.schoolId);
			return true;
		}

		case ACTIONS.SYNC_USER: {
			const outgoingMessage = await buildAddUserMessage(content);
			sendToExternalQueue(content.mxId, outgoingMessage);
			return true;
		}

		case ACTIONS.DELETE_USER: {
			const outgoingMessage = await buildDeleteUserMessage(content);
			sendToExternalQueue(content.mxId, outgoingMessage);
			return true;
		}

		case ACTIONS.SYNC_COURSE: {
			const outgoingMessage = await buildAddCourseMessage(content);
			sendToExternalQueue(content.mxId, outgoingMessage);
			return true;
		}

		case ACTIONS.DELETE_COURSE: {
			const outgoingMessage = await buildDeleteCourseMessage(content);
			sendToExternalQueue(content.mxId, outgoingMessage);
			return true;
		}

		case ACTIONS.SYNC_TEAM: {
			const outgoingMessage = await buildAddTeamMessage(content);
			sendToExternalQueue(content.mxId, outgoingMessage);
			return true;
		}

		case ACTIONS.DELETE_TEAM: {
			const outgoingMessage = await buildDeleteTeamMessage(content);
			sendToExternalQueue(content.mxId, outgoingMessage);
			return true;
		}

		default: {
			// message can't be processed
			return false;
		}
	}
};

const handleMessage = (incomingMessage) =>
	executeMessage(incomingMessage)
		.then((success) => {
			if (success) {
				channelReadInternal.ackMessage(incomingMessage);
			} else {
				channelReadInternal.rejectMessage(incomingMessage, false);
			}
			return success;
		})
		.catch((err) => {
			logger.error('MESSENGER SYNC: error while handling message', err);
			// retry message once (the second time it is redelivered)
			channelReadInternal.rejectMessage(incomingMessage, !incomingMessage.fields.redelivered);
			return false;
		});

const setup = () => {
	const number_of_servers = Configuration.get('NUMBER_OF_SERVERS');
	channelSendExternal = {};
	for (let mxId = 1; mxId <= number_of_servers; mxId++) {
		channelSendExternal[mxId] = getChannel(Configuration.get('RABBITMQ_MATRIX_QUEUE_EXTERNAL') + '_' + i, { durable: false });
	}
	
	channelReadInternal = getChannel(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), { durable: true });
	channelReadInternal.consumeQueue(handleMessage, { noAck: false });
};

module.exports = setup;
