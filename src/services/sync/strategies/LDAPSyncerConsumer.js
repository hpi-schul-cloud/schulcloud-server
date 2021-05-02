const { getChannel } = require('../../../utils/rabbitmq');
const { syncLogger } = require('../../../logger/syncLogger');
// TODO: later it is defined outside of Consumer and pass over constructure to make it configurable
const { School, User, Class } = require('./consumerStategies');

const { BadRequest } = require('../../../errors');

const { LDAP_SYNC_ACTIONS, LDAP_SYNC_CHANNEL_NAME } = require('./LDAPSyncer');

// TODO: put action to class or functions with bind filter and repo
// TODO: make possible actions configurable

class LDAPSyncerConsumer {
	constructor({ logLevel } = {}) {
		this.logLevel = logLevel || 'error';
		const shouldUseFilter = this.logLevel === 'error';

		// TODO: replace later over constructor import
		this.actions = {
			[LDAP_SYNC_ACTIONS.SYNC_SCHOOL]: new School(shouldUseFilter),
			[LDAP_SYNC_ACTIONS.SYNC_USER]: new User(shouldUseFilter),
			[LDAP_SYNC_ACTIONS.SYNC_CLASSES]: new Class(shouldUseFilter),
		};
	}

	useFilter(filter = null) {
		return this.logLevel === 'error' ? filter : null;
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
	const consumer = new LDAPSyncerConsumer();

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
