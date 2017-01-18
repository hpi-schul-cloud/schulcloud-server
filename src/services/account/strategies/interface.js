class AbstractLoginStrategy {
	constructor() {
		if (new.target === AbstractLoginStrategy) {
			throw new TypeError("Cannot construct AbstractLoginStrategy instances directly.");
		}
	}

	login() {
		throw new TypeError("login method has to be implemented.");
	}
}

module.exports = AbstractLoginStrategy;
