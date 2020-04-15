const { Configuration } = require('@schul-cloud/commons');
const { createChannel } = require('../../utils/rabbitmq');
const { buildAddUserMessage } = require('./utils');
const logger = require('../../logger');

const QUEUE_INTERNAL = Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL');
const QUEUE_EXTERNAL = Configuration.get('RABBITMQ_MATRIX_QUEUE_EXTERNAL');

let channel;

const validateMessage = (content) => {
	return (content.userId && (content.course || content.team || content.fullSync));
};

const handleMessage = async (incomingMessage) => {
	const content = JSON.parse(incomingMessage.content.toString());
	if (!validateMessage(content)) {
		logger.warning(`MESSENGER SYNC: invalid message in queue ${QUEUE_INTERNAL}`, incomingMessage);
		// message is invalid an can not be retried
		channel.reject(incomingMessage, false);
	}
	try {
		const addUserMessageObject = await buildAddUserMessage(content);
		const outgoingMessage = JSON.stringify(addUserMessageObject);
		channel.sendToQueue(QUEUE_EXTERNAL, Buffer.from(outgoingMessage), { persistent: true });
		channel.ack(incomingMessage);
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
