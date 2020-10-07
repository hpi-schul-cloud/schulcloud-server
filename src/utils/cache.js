const logger = require('../logger');

class Cache {
	constructor({ name, clearInterval } = {}) {
		this.cache = {};
		this.name = name || '';
		if (typeof clearInterval === 'number') {
			setInterval(this.clear.bind(this), clearInterval);
		}
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

	update(id, data) {
		this.cache[id] = data;
		logger.debug(`Update ${this.name} cache ${id}`, data);
	}

	get(id) {
		return this.cache[id];
	}
}

module.exports = Cache;
