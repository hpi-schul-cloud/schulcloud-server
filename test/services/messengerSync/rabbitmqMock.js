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

const consumeQueue = async (queue, callback, options) => {
	callbacks[queue] = callback;
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

const sendToQueue = (queue, queueOptions, msgJson, _) => {
	if (!queues[queue]) queues[queue] = [];
	queues[queue].push(msgJson);
};

const empty = () => {
	// empty
};

module.exports = {
	setup: empty,
	ackMessage: empty,
	rejectMessage: empty,
	sendToQueue,
	consumeQueue,
	queues,
	reset,
	triggerConsume,
};
