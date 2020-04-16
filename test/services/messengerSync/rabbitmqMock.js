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

const assertQueue = async () => {};

const prefetch = async () => {};

const consume = async (queue, callback, options) => {
	callbacks[queue] = callback;
};

const reject = async () => {};

const triggerConsume = (queue, message) => {
	if (callbacks[queue]) {
		return callbacks[queue]({
			content: JSON.stringify(message),
			fields: {},
		});
	}
	return undefined;
};

const sendToQueue = (queue, messageBuffer, options) => {
	if (!queues[queue]) queues[queue] = [];
	queues[queue].push(messageBuffer);
};

const createChannel = async () => ({
	sendToQueue,
	assertQueue,
	prefetch,
	consume,
	reject,
});

const setup = async (app) => {};

module.exports = {
	setup, createChannel, queues, reset, triggerConsume,
};
