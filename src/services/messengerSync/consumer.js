const { Configuration } = require('@schul-cloud/commons');
const { createChannel } = require('../../utils/rabbitmq');
const { buildAddUserMessage } = require('./utils');

const QUEUE_INTERNAL = Configuration.get('RABBITMQ_MATRIX_QUEUE_INTERNAL');
const QUEUE_EXTERNAL = Configuration.get('RABBITMQ_MATRIX_QUEUE_EXTERNAL');

let channel;

const handleMessage = async (incomingMessage) => {
	const content = JSON.parse(incomingMessage.content.toString());
	const addUserMessageObject = await buildAddUserMessage(content);
	const outgoingMessage = JSON.stringify(addUserMessageObject);
	channel.sendToQueue(QUEUE_EXTERNAL, Buffer.from(outgoingMessage), { persistent: true });
	channel.ack(incomingMessage);
};

const setup = async (app) => {
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
};

module.exports = setup;
