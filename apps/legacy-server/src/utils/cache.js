const logger = require('../logger');

const oneHour = 60 * 60 * 1000;

class Cache {
	// TODO: Use Redis for sync and for more the role service
	constructor({ name, clearInterval = oneHour } = {}) {
		this.cache = {};
		this.name = name || '';
		this.clearInterval = clearInterval;
	}

	clear() {
		this.cache = {};
		logger.debug(`Clear ${this.name} cache`);
	}

	createMongooseIndex(coreMongooseArray) {
		let index = '';
		coreMongooseArray.forEach((id) => {
			index += id;
		});
		return index;
	}

	update(key, value) {
		this.cache[key] = {
			value,
			validUntil: Date.now() + this.clearInterval,
		};
		logger.debug(`Update ${this.name} cache ${key}`, value);
	}

	get(key) {
		const entry = this.cache[key];
		if (!entry || entry.validUntil < Date.now()) return undefined;
		return entry.value;
	}
}

module.exports = Cache;
