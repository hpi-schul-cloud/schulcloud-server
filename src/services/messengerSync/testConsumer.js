#!/usr/bin/env node

const { Configuration } = require('@hpi-schul-cloud/commons');
const amqp = require('amqplib/callback_api');

amqp.connect(Configuration.get('RABBITMQ_URI'), (error0, connection) => {
	if (error0) {
		throw error0;
	}
	connection.createChannel((error1, channel) => {
		if (error1) {
			throw error1;
		}

		channel.assertQueue(Configuration.get('RABBITMQ_MATRIX_QUEUE_EXTERNAL'), {
			durable: false,
		});

		// eslint-disable-next-line no-console
		console.log(' [*] Waiting for messages in %s. To exit press CTRL+C');

		channel.consume(
			Configuration.get('RABBITMQ_MATRIX_QUEUE_EXTERNAL'),
			(msg) => {
				// eslint-disable-next-line no-console
				console.log(' [x] Received %s', msg.content.toString());
			},
			{
				noAck: true,
			}
		);
	});
});
