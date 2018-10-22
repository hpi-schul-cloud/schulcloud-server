class AbstractLDAPStrategy {
	constructor(config) {
		if (new.target === AbstractLDAPStrategy) {
			throw new TypeError("Cannot construct AbstractLDAPStrategy instances directly.");
		}
	}

	addUserToGroup(user, group) {
		throw new TypeError("method has to be implemented.");
    }

    removeUserFromGroup(user, group) {
		throw new TypeError("method has to be implemented.");
    }
}

module.exports = AbstractLDAPStrategy;
