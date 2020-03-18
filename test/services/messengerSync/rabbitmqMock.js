const queues = {};

const assertQueue = (queue, options) => {};

const sendToQueue = (queue, messageBuffer, options) => {
	if (!queues[queue]) queues[queue] = [];
	queues[queue].push(messageBuffer);
};

const createChannel = async () => {
	console.log('mock')
	return { sendToQueue, assertQueue };
};

const setup = async (app) => {};

module.exports = { setup, createChannel, queues };
