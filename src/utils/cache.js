const logger = require('../logger');

class Cache {
	constructor({ name } = {}) {
		this.cache = {};
		this.name = name || '';
	}

	createMongooseIndex(coreMongooseArray) {
		let index = '';
		coreMongooseArray.forEach((id) => {
			index += id;
		});
		return index;
	}

	clear() {
		this.cache = {};
		logger.info(`Clear ${this.name} cache`);
	}

	update(id, data) {
		this.cache[id] = data;
		logger.info(`Update ${this.name} cache ${id}`, data);
	}

	get(id) {
		return this.cache[id];
	}
}

module.exports = Cache;
