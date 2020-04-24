const { Configuration } = require('@schul-cloud/commons');
const { createChannel } = require('../../utils/rabbitmq');
const { ACTIONS, requestSyncForEachSchoolUser } = require('./producer');
const { buildAddUserMessage, messengerIsActivatedForSchool } = require('./utils');
const logger = require('../../logger');
const { ObjectId } = require('../../helper/compare');

let channel;

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
			break;
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
			break;
		}

		default: {
			logger.error(`${errorMsg}, invalid action.`, content);
			// message can't be processed
			return false;
		}
	}

	return true;
};

const sendToExternalQueue = (message) => {
	const msgJson = JSON.stringify(message);
	const msgBuffer = Buffer.from(msgJson);
	channel.sendToQueue(Configuration.get('RABBITMQ_MATRIX_QUEUE_EXTERNAL'), msgBuffer, { persistent: true });
};

const executeMessage = async (incomingMessage) => {
	const content = JSON.parse(incomingMessage.content.toString());
	if (!validateMessage(content)) {
		// message is invalid an can not be retried
		return false;
	}

	if (!await messengerIsActivatedForSchool(content)) {
		// school should not be synced
		return false;
	}

	switch (content.action) {
		case ACTIONS.SYNC_SCHOOL: {
			await requestSyncForEachSchoolUser(content.schoolId);
			return true;
		}

		case ACTIONS.SYNC_USER: {
			const outgoingMessage = await buildAddUserMessage(content);
			sendToExternalQueue(outgoingMessage);
			return true;
		}

		default: {
			// message can't be processed
			return false;
		}
	}
};

const handleMessage = (incomingMessage) => executeMessage(incomingMessage)
	.then((success) => {
		if (success) {
			channel.ack(incomingMessage);
		} else {
			channel.reject(incomingMessage, false);
		}
	})
	.catch((err) => {
		logger.error('MESSENGER SYNC: error while handling message', err);
		// retry message once (the second time it is redelivered)
		return channel.reject(incomingMessage, !incomingMessage.fields.redelivered);
	});

const setup = async (app) => {
	channel = await createChannel();

	await Promise.all([
		channel.assertQueue(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), { durable: true }),
		channel.assertQueue(Configuration.get('RABBITMQ_MATRIX_QUEUE_EXTERNAL'), { durable: false }),
	]);
	channel.prefetch(Configuration.get('RABBITMQ_MATRIX_CONSUME_CONCURRENCY'));
	channel.consume(Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL'), handleMessage, {
		noAck: false,
	});
};

module.exports = setup;
