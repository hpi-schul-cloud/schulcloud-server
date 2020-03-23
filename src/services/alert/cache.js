const { SC_THEME } = require('../../../config/globals');

const MessageProvider = [];
let messages = [];
let isInit = false;

class Cache {
	/**
	 * @param {number} time how long message should remain cached in minutes
	 */
	constructor(time) {
		this.time = time;
	}

	async init() {
		if (!isInit) {
			isInit = true;
			this.updateMessages();

			setInterval(() => {
				this.updateMessages();
			}, 1000 * 60 * this.time);
		}
	}

	async updateMessages() {
		let success = false;
		let newMessages = [];

		for (let i = 0; i < MessageProvider.length; i += 1) {
			const data = await MessageProvider[i].getMessage(SC_THEME);
			if (!data.success) { success = false; return; }
			newMessages = newMessages.concat(data.messages);
			success = true;
		}

		if (success) { messages = newMessages; }
	}

	getMessages() {
		return messages;
	}

	addMessageProvider(provider, featureEnabled) {
		if (featureEnabled) {
			MessageProvider.push(provider);
		}
	}
}

module.exports = Cache;
