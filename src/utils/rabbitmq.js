const { Configuration } = require('@hpi-schul-cloud/commons');
const amqp = require('amqplib');
const logger = require('../logger');

let connection;

const getConnection = async () => {
	if (!Configuration.get('RABBITMQ_URI')) {
		throw new Error('RabbitMQ is not configured.');
	}

	if (connection) {
		return connection;
	}

	try {
		connection = await amqp.connect(
			`${Configuration.get('RABBITMQ_URI')}?heartbeat=${Configuration.get('RABBITMQ_HEARTBEAT_INTERVAL_IN_SECONDS')}`
		);
		connection.on('close', () => {
			logger.warning('RabbitMQ connection was closed.');
			connection = undefined;
		});
		return connection;
	} catch (err) {
		connection = undefined;
		throw err;
	}
};

const setup = async () => {
	try {
		await getConnection();
	} catch (err) {
		logger.error('RabbitMQ unable to setup.', err);
	}
};

class Channel {
	constructor(queue, queueOptions) {
		this.queue = queue;
		this.queueOptions = queueOptions || {};
	}

	async connect() {
		try {
			const conn = await getConnection();
			this.channel = await conn.createConfirmChannel();
			// the default is 0, 0 means get absolutely everything, internet claims this is limited by rabbitmq by 2000, which basically defeats the purpose of using separate processes
			await this.channel.prefetch(Configuration.get('LEGACY_RABBITMQ_GLOBAL_PREFETCH_COUNT'), true);
			await this.channel.assertQueue(this.queue, this.queueOptions);
			this.channel.on('close', () => {
				logger.warning('RabbitMQ channel was closed.');
				this.channel = undefined;
			});
			return this.channel;
		} catch (err) {
			this.channel = undefined;
			throw err;
		}
	}

	async getChannel() {
		if (this.channel) {
			return this.channel;
		}

		return this.connect();
	}

	async sendToQueueRaw(msgBuffer, msgOptions) {
		try {
			const ch = await this.getChannel();
			ch.sendToQueue(this.queue, msgBuffer, msgOptions);
		} catch (err) {
			logger.error('RabbitMQ unable to send message.', err);
		}
	}

	sendToQueue(msgJson, msgOptions) {
		const msgString = JSON.stringify(msgJson);
		const msgBuffer = Buffer.from(msgString);
		this.sendToQueueRaw(msgBuffer, msgOptions);
	}

	async consumeQueue(consumer, options) {
		try {
			const ch = await this.getChannel();
			ch.consume(this.queue, consumer, options);
			ch.on('close', () => {
				// try to reconnect consumer if channel was closed for some reason
				setTimeout(() => {
					this.consumeQueue(consumer, options);
				}, 5000);
			});
		} catch (err) {
			logger.error('RabbitMQ unable to consume queue, retry.', err);

			// try again to reconnect consumer
			setTimeout(() => {
				this.consumeQueue(consumer, options);
			}, 5000);
		}
	}

	async ackMessage(message, allUpTo) {
		try {
			const ch = await this.getChannel();
			ch.ack(message, allUpTo);
		} catch (err) {
			logger.error('RabbitMQ unable to ack message.', err);
		}
	}

	async rejectMessage(message, requeue) {
		try {
			const ch = await this.getChannel();
			ch.reject(message, requeue);
		} catch (err) {
			logger.error('RabbitMQ unable to reject message.', err);
		}
	}
}

const getChannel = (queue, options) => new Channel(queue, options);

module.exports = {
	setup,
	getChannel,
};
