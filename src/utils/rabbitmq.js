const { Configuration } = require('@schul-cloud/commons');
const amqp = require('amqplib');

let connection;

const createChannel = async () => {
	if (connection) {
		const con = await Promise.resolve(connection); // ensure connection has resolved
		return con.createChannel();
	}
};

const setup = async (app) => {
	connection = amqp.connect(Configuration.get('RABBITMQ_URI'));
};

module.exports = { setup, createChannel };
