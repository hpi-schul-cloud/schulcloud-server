const queues = {};
const callbacks = {};

const reset = () => {
	Object.keys(queues).forEach((key) => {
		delete queues[key];
	});
	Object.keys(callbacks).forEach((key) => {
		delete callbacks[key];
	});
};

const triggerConsume = (queue, message) => {
	if (callbacks[queue]) {
		return callbacks[queue]({
			content: JSON.stringify(message),
			fields: {},
		});
	}
	return undefined;
};

const channel = {
	assertQueue: () => {},
	on: () => {},
	prefetch: () => {},
	consume: (queue, callback) => {
		callbacks[queue] = callback;
	},
	ack: () => {},
	reject: () => {},
	sendToQueue: (queue, msg) => {
		const msgParsed = JSON.parse(msg);
		if (!queues[queue]) queues[queue] = [];
		queues[queue].push(msgParsed);
	},
};

const connection = {
	on: () => {},
	createChannel: async () => channel,
};

const amqp = {
	connect: async () => connection,
};

module.exports = {
	amqplib: amqp,

	// testing
	queues,
	callbacks,
	reset,
	triggerConsume,
};
