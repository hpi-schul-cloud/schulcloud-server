const { Forbidden, BadRequest } = require('../../../errors');
const { userModel } = require('../model');
const docs = require('../docs');
const logger = require('../../../logger');

class RocketChatLogin {
	constructor(options) {
		this.options = options || {};
		this.docs = docs;
	}

	/**
	 * Logs in a user given by his Id
	 * @param {*} userId Id of a user in the schulcloud
	 * @param {*} params
	 */
	async get(userId, params) {
		if (userId.toString() !== params.account.userId.toString()) {
			return Promise.reject(new Forbidden('you may only log into your own rocketChat account'));
		}
		const service = this.app.service('/nest-rocket-chat');
		try {
			const rcAccount = await this.app.service('/rocketChat/user').getOrCreateRocketChatAccount(userId);

			let { authToken } = rcAccount;
			// user already logged in
			if (authToken !== '' && authToken !== undefined) {
				try {
					const res = service.me(authToken, rcAccount.rcId);
					await service.setUserStatus(authToken, rcAccount.rcId, 'offline');
					if (res.success) return { authToken };
				} catch (err) {
					logger.error(err);
					authToken = '';
				}
			}

			// log in user
			const response = await service.createUserToken(rcAccount.rcId);
			({ authToken } = response.data);
			if (response.success === true && authToken !== undefined) {
				await userModel.updateOne({ username: rcAccount.username }, { authToken });
				await service.setUserStatus(authToken, rcAccount.rcId, 'offline');
				return Promise.resolve({ authToken });
			}
			return Promise.reject(new BadRequest('False response data from rocketChat'));
		} catch (err) {
			logger.warning(new Forbidden('Can not create token.', err));
			throw new Forbidden('Can not create token.', err);
		}
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = RocketChatLogin;
