class AbstractLoginStrategy {
	constructor() {
		if (new.target === AbstractLoginStrategy) {
			throw new TypeError("Cannot construct AbstractLoginStrategy instances directly");
		}

		// login is expected to take two parameters: credentials and system
		if (typeof(this.login) != 'function') {
			throw new TypeError("Must override login method");
		}
	}
}

module.exports = AbstractLoginStrategy;
