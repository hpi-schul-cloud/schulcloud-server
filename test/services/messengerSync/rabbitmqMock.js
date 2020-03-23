let queues = {};

const reset = () => {
	queues = {};
};

const assertQueue = () => {};

const sendToQueue = (queue, messageBuffer, options) => {
	if (!queues[queue]) queues[queue] = [];
	queues[queue].push(messageBuffer);
};

const createChannel = async () => ({ sendToQueue, assertQueue });

const setup = async (app) => {};

module.exports = {
	setup, createChannel, queues, reset,
};
