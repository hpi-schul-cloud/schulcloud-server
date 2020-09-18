const { Configuration } = require('@schul-cloud/commons');
const amqp = require('amqplib');

let connection;

const createChannel = async () => {
	if (connection) {
		const con = await connection; // ensure connection has resolved
		return con.createChannel();
	}

	throw new Error('No RabbitMQ connection available.');
};

const setup = async (app) => {
	if (Configuration.get('FEATURE_RABBITMQ_ENABLED')) {
		connection = amqp.connect(Configuration.get('RABBITMQ_URI'));
	}
};

module.exports = { setup, createChannel };
