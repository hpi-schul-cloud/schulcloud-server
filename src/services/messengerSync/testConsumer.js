#!/usr/bin/env node

const {Configuration} = require('@schul-cloud/commons');
const amqp = require('amqplib/callback_api');

const RABBITMQ_URI = Configuration.get('RABBITMQ_URI');
const QUEUE = Configuration.get('RABBITMQ_MATRIX_QUEUE_EXTERNAL');

amqp.connect(RABBITMQ_URI, (error0, connection) => {
	if (error0) {
		throw error0;
	}
	connection.createChannel((error1, channel) => {
		if (error1) {
			throw error1;
		}

		channel.assertQueue(QUEUE, {
			durable: false
		});

		// eslint-disable-next-line no-console
		console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", QUEUE);

		channel.consume(QUEUE, (msg) => {
			// eslint-disable-next-line no-console
			console.log(" [x] Received %s", msg.content.toString());
		}, {
			noAck: true
		});
	});
});
