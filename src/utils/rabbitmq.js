const { Configuration } = require('@schul-cloud/commons');
const amqp = require('amqplib');
const logger = require('../logger');

let connection;
let channel;

// Internal function
// - Maintaining connection and channel.

const getConnection = async () => {
	if (!Configuration.get('FEATURE_RABBITMQ_ENABLED') || !Configuration.get('RABBITMQ_URI')) {
		throw new Error('RabbitMQ is not configured.');
	}

	if (connection) {
		return connection;
	}

	try {
		connection = await amqp.connect(Configuration.get('RABBITMQ_URI'));
		connection.on('close', () => {
			logger.error('RabbitMQ connection was closed.');
			connection = undefined;
		});
		return connection;
	} catch (err) {
		connection = undefined;
		logger.error('RabbitMQ', err);
		throw new Error('RabbitMQ is not able to connect.');
	}
};

const getChannel = async () => {
	if (channel) {
		return channel;
	}

	try {
		const conn = await getConnection();
		channel = await conn.createChannel();
		channel.on('close', () => {
			logger.error('RabbitMQ channel was closed.');
			channel = undefined;
		});
		return channel;
	} catch (err) {
		channel = undefined;
		logger.error('RabbitMQ', err);
		throw new Error('RabbitMQ is not able to create channel.');
	}
};

// Exposed function
// - Errors are catched and logged to avoid external influcene.

const sendToQueueRaw = async (queue, queueOptions, msgBuffer, msgOptions) => {
	try {
		const ch = await getChannel();
		ch.assertQueue(queue, queueOptions);
		ch.sendToQueue(queue, msgBuffer, msgOptions);
	} catch (err) {
		logger.error('RabbitMQ unable to send message.', err);
	}
};

const sendToQueue = (queue, queueOptions, msgJson, msgOptions) => {
	const msgString = JSON.stringify(msgJson);
	const msgBuffer = Buffer.from(msgString);
	sendToQueueRaw(queue, queueOptions, msgBuffer, msgOptions);
};

const consumeQueue = async (queue, queueOptions, consumer, options) => {
	try {
		const ch = await getChannel();
		ch.assertQueue(queue, queueOptions);
		ch.prefetch(Configuration.get('RABBITMQ_MATRIX_CONSUME_CONCURRENCY'));
		ch.consume(queue, consumer, options);
		ch.on('close', () => {
			// try to reconnect consumer if channel was closed for some reason
			setTimeout(() => {
				consumeQueue(queue, queueOptions, consumer, options);
			}, 1000);
		});
	} catch (err) {
		logger.error('RabbitMQ unable to consume queue.', err);

		// try again to reconnect consumer
		setTimeout(() => {
			consumeQueue(queue, queueOptions, consumer, options);
		}, 1000);
	}
};

const ackMessage = async (message, allUpTo) => {
	try {
		const ch = await getChannel();
		ch.ack(message, allUpTo);
	} catch (err) {
		logger.error('RabbitMQ unable to ack message.', err);
	}
};

const rejectMessage = async (message, requeue) => {
	try {
		const ch = await getChannel();
		ch.reject(message, requeue);
	} catch (err) {
		logger.error('RabbitMQ unable to reject message.', err);
	}
};

const setup = async () => {
	if (Configuration.get('FEATURE_RABBITMQ_ENABLED')) {
		try {
			await getChannel();
		} catch (err) {
			logger.error('RabbitMQ unable to setup.', err);
		}
	}
};

module.exports = { setup, sendToQueueRaw, sendToQueue, consumeQueue, ackMessage, rejectMessage };
