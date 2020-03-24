const { Configuration } = require('@schul-cloud/commons');
const amqp = require('amqplib');

let connection;

const createChannel = async () => {
	if (connection) {
		const con = await Promise.resolve(connection); // ensure connection has resolved
		return con.createChannel();
	}
	return null;
};

const setup = async (app) => {
	if (Configuration.get('FEATURE_RABBITMQ_ENABLED')) {
		connection = amqp.connect(Configuration.get('RABBITMQ_URI'));
	}
};

module.exports = { setup, createChannel };
