const AbstractChatStrategy = require('./interface.js');
const rp = require('request-promise');

const UserModel = require('../../user/model');

// TODO: Find solution for authentication with rocket chat instance.

class RocketChatStrategy extends AbstractChatStrategy {

	init() {

	}

	createUser(url, object) {
		object.joinDefaultChannels = false;

		let options = {
			method: 'POST',
			uri: url + '/api/v1/users.create',
			body: object,
			headers: {
				"X-Auth-Token": "",
				"X-User-Id": ""
			},
			json: true
		};

		return rp(options)
			.then((body) => {
				return body;
			});

	}

	updateUser(url, object) {

	}

	listUsers(url) {

	}

	deleteUser(url, userId) {

	}

	createGroup(url, object) {
		let options = {
			method: 'POST',
			uri: url + '/api/v1/groups.create',
			body: object,
			headers: {
				"X-Auth-Token": "",
				"X-User-Id": ""
			},
			json: true
		};

		return rp(options)
			.then((body) => {
				return body;
			});
	}

	updateGroup(url, object) {

	}

	listGroups(url) {

	}

	deleteGroup(url, groupId) {

	}

}

module.exports = RocketChatStrategy;
