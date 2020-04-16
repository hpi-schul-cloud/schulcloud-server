const { Configuration } = require('@schul-cloud/commons');
const { createChannel } = require('../../utils/rabbitmq');
const { requestSyncForEachSchoolUser } = require('./producer');
const { buildAddUserMessage, messengerActivatedForSchool } = require('./utils');
const logger = require('../../logger');

const QUEUE_INTERNAL = Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL');
const QUEUE_EXTERNAL = Configuration.get('RABBITMQ_MATRIX_QUEUE_EXTERNAL');

let channel;

const validateMessage = (content) => {
	if (!content.action) {
		return false;
	}

	if (!content.userId || !content.schoolId) {
		return false;
	}

	return (content.courses || content.teams || content.fullSync);
};

const sendToQueue = (message) => {
	const msgJson = JSON.stringify(message);
	const msgBuffer = Buffer.from(msgJson);
	channel.sendToQueue(QUEUE_EXTERNAL, msgBuffer, { persistent: true });
};

const handleMessage = async (incomingMessage) => {
	const content = JSON.parse(incomingMessage.content.toString());
	if (!validateMessage(content)) {
		logger.warning(`MESSENGER SYNC: invalid message in queue ${QUEUE_INTERNAL}`, content);
		// message is invalid an can not be retried
		channel.reject(incomingMessage, false);
	}
	try {
		if (!await messengerActivatedForSchool(content)) {
			// school should not be synced
			channel.reject(incomingMessage, false);
		}

		switch (content.action) {
			case 'syncSchool': {
				await requestSyncForEachSchoolUser(content.schoolId);
				channel.ack(incomingMessage);
				break;
			}

			case 'syncUser': {
				const outgoingMessage = await buildAddUserMessage(content);
				sendToQueue(outgoingMessage);
				channel.ack(incomingMessage);
				break;
			}

			default: {
				// message can't be processed
				channel.reject(incomingMessage, false);
			}
		}
	} catch (err) {
		logger.error(`MESSENGER SYNC: error while handling message in queue ${QUEUE_INTERNAL} `, err);
		// retry message once (the second time it is redelivered)
		channel.reject(incomingMessage, !incomingMessage.fields.redelivered);
	}
};

const setup = async (app) => {
	channel = await createChannel();

	await Promise.all([
		channel.assertQueue(QUEUE_INTERNAL, { durable: true }),
		channel.assertQueue(QUEUE_EXTERNAL, { durable: false }),
	]);
	channel.prefetch(30);
	channel.consume(QUEUE_INTERNAL, handleMessage, {
		noAck: false,
	});
};

module.exports = setup;
