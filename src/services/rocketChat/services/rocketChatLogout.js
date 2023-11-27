const { BadRequest } = require('../../../errors');
const logger = require('../../../logger');
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
			const service = this.app.service('/nest-rocket-chat');
			if (rcUser.authToken && rcUser.authToken !== '') {
				await userModel.updateOne({ username: rcUser.username }, { authToken: '' });
				await service.logoutUser(rcUser.authToken, rcUser.rcId);
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
