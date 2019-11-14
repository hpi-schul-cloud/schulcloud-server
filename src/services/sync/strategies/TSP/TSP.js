const rp = require('request-promise-native');
const url = require('url');

const USER_SOURCE = 'tsp'; // used as source attribute in created users and classes
const SOURCE_ID_ATTRIBUTE = 'tspUid'; // name of the uid attribute within sourceOptions

/**
 * Generates a username for a given user-like object
 * @param {User|TSP-User} user Schul-Cloud user or TSP user object
 * @throws {Error} if user is not a valid user object
 */
const getUsername = (user) => {
	let username = '';
	if (user.sourceOptions) {
		// user is a Schul-Cloud user or behaves like it
		username = `${USER_SOURCE}/${user.sourceOptions[SOURCE_ID_ATTRIBUTE]}`;
	} else if (user.authUID) {
		// user is a TSP user (e.g. during authentication)
		username = `${USER_SOURCE}/${user.authUID}`;
	} else {
		throw new Error('Invalid user object.', user);
	}
	return username.toLowerCase();
};

/**
 * Generate an email address for a given user-like object
 * @param {User|TSP-User} user Schul-Cloud user or TSP user object
 */
const getEmail = (user) => `${getUsername(user)}@schul-cloud.org`;

/**
 * TSP API wrapper
 * @class TspApi
 */
class TspApi {
	constructor(baseUrl) {
		this.baseUrl = baseUrl;
	}

	async request(path, lastChange) {
		// todo: handle lastChange
		const requestUrl = url.resolve(this.baseUrl, path);
		const response = await rp(requestUrl);
		// todo: is this a string or object?
		return response;
	}
}

module.exports = {
	USER_SOURCE,
	SOURCE_ID_ATTRIBUTE,
	TspApi,
	getUsername,
	getEmail,
};
