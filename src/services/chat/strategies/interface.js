class AbstractChatStrategy {
	constructor() {
		if (new.target === AbstractChatStrategy) {
			throw new TypeError("Cannot construct AbstractChatStrategy instances directly.");
		}
	}

	init() {
		throw new TypeError("init method has to be implemented.");
	}

	createUser() {
		throw new TypeError("createUser method has to be implemented.");
	}

	updateUser() {
		throw new TypeError("updateUser method has to be implemented.");
	}

	listUsers() {
		throw new TypeError("listUsers method hast to be implemented");
	}

	deleteUser() {
		throw new TypeError("deleteUser method hast to be implemented");
	}

	createGroup() {
		throw new TypeError("createGroup method has to be implemented.");
	}

	updateGroup() {
		throw new TypeError("updateGroup method has to be implemented.");
	}

	listGroups() {
		throw new TypeError("listGroups method hast to be implemented");
	}

	deleteGroup() {
		throw new TypeError("deleteGroup method hast to be implemented");
	}
}

module.exports = AbstractChatStrategy;
