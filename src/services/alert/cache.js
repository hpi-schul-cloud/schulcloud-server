const { Configuration } = require('@schul-cloud/commons');

const MessageProvider = [];
let messages = null;
let lastUpdatedTimestamp = 0;

class Cache {
	/**
	 * @param {number} time how long message should remain cached in minutes
	 */
	constructor(time) {
		this.time = time;
	}

	async updateMessages() {
		let success = false;
		let newMessages = [];

		for (let i = 0; i < MessageProvider.length; i += 1) {
			const data = await MessageProvider[i].getMessage(Configuration.get('SC__THEME'));
			if (!data.success) {
				success = false;
				return;
			}
			newMessages = newMessages.concat(data.messages);
			success = true;
		}

		if (success) {
			messages = newMessages;
			lastUpdatedTimestamp = Date.now();
		}
	}

	async getMessages() {
		if (lastUpdatedTimestamp < Date.now() - 1000 * 60 * this.time) {
			if (!messages) {
				await this.updateMessages();
			} else {
				this.updateMessages();
			}
		}
		return messages || [];
	}

	addMessageProvider(provider, featureEnabled) {
		if (featureEnabled) {
			MessageProvider.push(provider);
		}
	}
}

module.exports = Cache;
