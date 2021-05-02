const { Configuration } = require('@hpi-schul-cloud/commons');

const { getChannel } = require('../../../utils/rabbitmq');
const { syncLogger } = require('../../../logger/syncLogger');

const { SchoolAction, UserAction, ClassAction } = require('./consumerStategies');

const { BadRequest } = require('../../../errors');

const { LDAP_SYNC_CHANNEL_NAME } = require('./LDAPSyncer');

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

	const shouldUseFilter = Configuration.get('SYNC_LOG_LEVEL') === 'error';

	const consumer = new LDAPSyncerConsumer(
		new SchoolAction(shouldUseFilter),
		new UserAction(shouldUseFilter),
		new ClassAction(shouldUseFilter)
	);

	const handleMessage = (incomingMessage) =>
		consumer
			.executeMessage(incomingMessage)
			.then(() => true)
			.catch((err) => {
				syncLogger.error(err);
				return false;
			})
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
