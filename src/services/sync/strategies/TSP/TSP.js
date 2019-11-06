const rp = require('request-promise-native');
const url = require('url');

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
	TspApi,
};
