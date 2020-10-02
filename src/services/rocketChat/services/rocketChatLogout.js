const request = require('request-promise-native');
const reqlib = require('app-root-path').require;

const { BadRequest } = reqlib('src/utils/errors');
const { getRequestOptions } = require('../helpers');
const { userModel } = require('../model');
const docs = require('../docs');

class RocketChatLogout {
	constructor(options) {
		this.options = options || {};
		this.docs = docs;
	}

	/**
	 * logs a user given by his schulcloud id out of rocketChat
	 * @param {*} userId
	 * @param {*} params
	 */
	async get(userId, params) {
		try {
			const rcUser = await this.app.service('/rocketChat/user').getOrCreateRocketChatAccount(userId, params);
			if (rcUser.authToken && rcUser.authToken !== '') {
				const headers = {
					authToken: rcUser.authToken,
					userId: rcUser.rcId,
				};
				await userModel.update({ username: rcUser.username }, { authToken: '' });
				await request(getRequestOptions('/api/v1/logout', {}, false, headers));
			}
			return 'success';
		} catch (error) {
			throw new BadRequest('could not log out user');
		}
	}

	/**
	 * react to a user logging out
	 * @param {*} context
	 */
	onAuthenticationRemoved(context) {
		this.get(context.userId);
	}

	/**
	 * Register methods of the service to listen to events of other services
	 * @listens authentication:removed
	 */
	registerEventListeners() {
		this.app.service('authentication').on('removed', this.onAuthenticationRemoved.bind(this));
	}

	setup(app) {
		this.app = app;
		this.registerEventListeners();
	}
}

module.exports = RocketChatLogout;
