let queues = {};

const reset = () => {
	queues = {};
};

const assertQueue = async () => {};

const prefetch = async () => {};

const consume = async () => {};

const sendToQueue = (queue, messageBuffer, options) => {
	if (!queues[queue]) queues[queue] = [];
	queues[queue].push(messageBuffer);
};

const createChannel = async () => ({
	sendToQueue,
	assertQueue,
	prefetch,
	consume,
});

const setup = async (app) => {};

module.exports = {
	setup, createChannel, queues, reset,
};
