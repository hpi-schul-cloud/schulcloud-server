const sinon = require('sinon');

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

function clearCache(module) {
	delete require.cache[require.resolve(module)];
}

function requireUncached(module) {
	clearCache(module);
	// eslint-disable-next-line global-require, import/no-dynamic-require
	return require(module);
}

let amqpStub;

const setupMock = () => {
	const amqpLib = requireUncached('amqplib');
	clearCache('../../../src/services/messengerSync');
	clearCache('../../../src/services/messengerSync/producer');
	clearCache('../../../src/services/messengerSync/consumer');
	clearCache('../../../src/services/messengerSync/eventListener');
	clearCache('../../../src/services/messengerSync/services/schoolSyncService');
	clearCache('../../../src/services/sync/strategies');
	clearCache('../../../src/services/sync/strategies/LDAPSyncer');
	clearCache('../../../src/services/sync/strategies/LDAPSyncerConsumer');
	clearCache('../../../src/services/sync/strategies/LDAPSystemSyncer');
	clearCache('../../../src/services/sync');
	clearCache('../../../src/utils/rabbitmq');
	clearCache('../../../src/services');
	clearCache('../../../src/app');
	clearCache('../helpers/testObjects');

	amqpStub = sinon.stub(amqpLib, 'connect').callsFake(amqp.connect);
	return requireUncached('../../../src/app');
};

const closeMock = () => {
	amqpStub.restore();
};

module.exports = {
	amqplib: amqp,

	// testing
	queues,
	callbacks,
	reset,
	triggerConsume,
	setupMock,
	closeMock,
};
