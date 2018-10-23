class AbstractLDAPStrategy {
	constructor(config) {
		if (new.target === AbstractLDAPStrategy) {
			throw new TypeError("Cannot construct AbstractLDAPStrategy instances directly.");
		}
	}
    getSchoolsQuery() {
        throw new TypeError('Method has to be implemented.');
    }

    getUsersQuery(school) {
        throw new TypeError('Method has to be implemented.');
    }

    getClassesQuery(school) {
        throw new TypeError('Method has to be implemented.');
    }

	addUserToGroup(user, group) {
		throw new TypeError("method has to be implemented.");
    }

    removeUserFromGroup(user, group) {
		throw new TypeError("method has to be implemented.");
    }
}

module.exports = AbstractLDAPStrategy;
