const request = require('request-promise-native');

const { BadRequest } = require('../../../errors');
const logger = require('../../../logger');
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
			throw new BadRequest('could not log out user', error);
		}
	}

	/**
	 * react to a user logging out
	 * @param {*} context
	 */
	onAuthenticationRemoved(context) {
		this.get(context.userId).catch((err) => {
			// catch it, but is used as event and async from request.
			// do not throw this error up
			// TODO create an eventErrorHandler for it, that log and send it to Sentry
			logger.error('onAuthenticationRemoved', err);
		});
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
