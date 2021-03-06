const { SC_THEME } = require('../../../config/globals');

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

		// set last updated always to avoid DoS in error state
		// set last updated here to avoid updating cache simultaneously for multiple times
		lastUpdatedTimestamp = Date.now();

		const promises = MessageProvider.map(async (provider) => {
			const data = await provider.getMessage(SC_THEME);
			if (!data.success) {
				success = false;
				return;
			}
			newMessages = newMessages.concat(data.messages);
			success = true;
		});

		await Promise.all(promises);

		if (success) {
			messages = newMessages;
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
