const amqp = require('amqplib');

let connection;

const createChannel = async () => {
	if (connection) {
		const con = await Promise.resolve(connection); // ensure connection has resolved
		return con.createChannel();
	}
};

const setup = async (app) => {
	connection = amqp.connect('amqp://192.168.99.100');
};

module.exports = { setup, createChannel };
