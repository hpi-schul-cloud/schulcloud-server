const amqp = require('amqplib');

let connection;

const createChannel = async () => {
	await connection;
	connection.createChannel();
};

const setup = async (app) => {
	connection = amqp.connect('amqp://192.168.99.101');
};

module.exports = { setup, createChannel };
