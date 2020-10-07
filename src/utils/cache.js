const logger = require('../logger');

class Cache {
	constructor({ name } = {}) {
		this.cache = {};
		this.name = name || '';
	}

	createMongooseCacheIndex(coreMongooseArray) {
		let index = '';
		coreMongooseArray.forEach((id) => {
			index += id;
		});
		return index;
	}

	clearCache() {
		this.cache = {};
		logger.info(`Clear ${this.name} cache`);
	}

	updateCache(id, data) {
		this.cache[id] = data;
		logger.info(`Update ${this.name} cache ${id}`, data);
	}

	getFromCache(id) {
		return this.cache[id];
	}
}

module.exports = Cache;
