/* eslint-disable no-unused-vars */
class Adapter {
	constructor() {
		if (new.target === Adapter) {
			throw new TypeError('Cannot construct Abstract instances directly');
		}
	}

	/**
	 * Return
	 * @param {String} instances
	 */
	async getMessage(instances) {
		throw new Error('You have to implement the method getMessage!');
	}
}

module.exports = Adapter;
