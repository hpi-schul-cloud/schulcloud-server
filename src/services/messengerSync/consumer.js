const { createChannel } = require('../../utils/rabbitmq');
const { buildAddUserMessage } = require('./utils');

const internalQueue = 'matrix_sync_unpopulated';
const externalQueue = 'matrix_sync_populated';
let channel;

const handleMessage = async (incomingMessage) => {
	const content = JSON.parse(incomingMessage.content.toString());
	const addUserMessageObject = await buildAddUserMessage(content);
	const outgoingMessage = JSON.stringify(addUserMessageObject);
	channel.sendToQueue(externalQueue, Buffer.from(outgoingMessage), { persistent: true });
	channel.ack(incomingMessage);
};

const setup = async (app) => {
	channel = await createChannel();

	// internal queue
	channel.assertQueue(internalQueue, {
		durable: true,
	});
	channel.prefetch(30);
	channel.consume(internalQueue, handleMessage, {
		noAck: false,
	});

	// external queue
	channel.assertQueue(externalQueue, {
		durable: true,
	});
};

module.exports = setup;
