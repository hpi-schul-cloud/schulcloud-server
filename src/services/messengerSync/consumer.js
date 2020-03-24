const { Configuration } = require('@schul-cloud/commons');
const { createChannel } = require('../../utils/rabbitmq');
const { buildAddUserMessage } = require('./utils');
const logger = require('../../logger');

const QUEUE_INTERNAL = Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL');
const QUEUE_EXTERNAL = Configuration.get('RABBITMQ_MATRIX_QUEUE_EXTERNAL');

let channel;

const validateMessage = (content) => {
	if (content.userId && (content.course || content.team || content.schoolSync)) return true;
	return false;
};

const handleMessage = async (incomingMessage) => {
	const content = JSON.parse(incomingMessage.content.toString());
	if (!validateMessage) {
		logger.warning(`invalid message in queue ${QUEUE_INTERNAL}`, incomingMessage);
		channel.nack(incomingMessage);
	}
	try {
		const addUserMessageObject = await buildAddUserMessage(content);
		const outgoingMessage = JSON.stringify(addUserMessageObject);
		channel.sendToQueue(QUEUE_EXTERNAL, Buffer.from(outgoingMessage), { persistent: true });
		channel.ack(incomingMessage);
	} catch (err) {
		logger.error(`error while handling message in queue ${QUEUE_INTERNAL}`, err);
		channel.nack(incomingMessage);
	}
};

const setup = async (app) => {
	if (Configuration.get('FEATURE_RABBITMQ_ENABLED')) {
		channel = await createChannel();

		// internal queue
		channel.assertQueue(QUEUE_INTERNAL, {
			durable: true,
		});
		channel.prefetch(30);
		channel.consume(QUEUE_INTERNAL, handleMessage, {
			noAck: false,
		});

		// external queue
		channel.assertQueue(QUEUE_EXTERNAL, {
			durable: false,
		});
	}
};

module.exports = setup;
