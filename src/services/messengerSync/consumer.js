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
	channel.assertQueue(internalQueue, {
		durable: false,
	});

	channel.assertQueue(externalQueue, {
		durable: false,
	});

	channel.consume(internalQueue, handleMessage, {
		noAck: false,
	});
};

module.exports = setup;
