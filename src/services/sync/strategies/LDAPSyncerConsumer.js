const { getChannel } = require('../../../utils/rabbitmq');
const { syncLogger } = require('../../../logger/syncLogger');
const { NODE_ENV, ENVIRONMENTS } = require('../../../../config/globals');

const { SchoolAction, UserAction, ClassAction } = require('./consumerActions');

const { BadRequest } = require('../../../errors');

const { LDAP_SYNC_CHANNEL_NAME } = require('./LDAPSyncer');

/**
 * This is the main message consumer class which takes a list of executable actions.
 * Each action should have a type and a function exec.
 * By consuming a message the consumer decide which action to use for the execution by the actionType.
 */
class LDAPSyncerConsumer {
	constructor(...actions) {
		this.actions = {};
		actions.forEach((action) => {
			this.actions[action.getType()] = action;
		});
	}

	async executeMessage(incomingMessage) {
		const content = JSON.parse(incomingMessage.content.toString());

		if (this.actions[content.action]) {
			return this.actions[content.action].exec(content);
		}
		throw new BadRequest(`The ${content.action} is not valid message action.`);
	}
}

const setupConsumer = () => {
	const syncQueue = getChannel(LDAP_SYNC_CHANNEL_NAME, { durable: true });

	const shouldUseFilter = NODE_ENV === ENVIRONMENTS.PRODUCTION;
	const consumer = new LDAPSyncerConsumer(
		new SchoolAction(shouldUseFilter),
		new UserAction(shouldUseFilter),
		new ClassAction(shouldUseFilter)
	);

	const handleMessage = (incomingMessage) =>
		consumer
			.executeMessage(incomingMessage)
			.catch((err) => syncLogger.error(err))
			.finally(() => {
				syncLogger.debug({ content: JSON.parse(incomingMessage.content.toString()) });
				syncQueue.ackMessage(incomingMessage);
			});

	return syncQueue.consumeQueue(handleMessage, { noAck: false });
};

module.exports = {
	consumer: setupConsumer,
	LDAPSyncerConsumer,
};
