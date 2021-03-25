const request = require('request-promise-native');

const { Forbidden, BadRequest } = require('../../../errors');
const { getRequestOptions } = require('../helpers');
const { userModel } = require('../model');
const docs = require('../docs');
const logger = require('../../../logger');


const setUserStatus = async (authenticationHeaders, status) => {
	return request(getRequestOptions('/api/v1/users.setStatus', {message: '', status}, false, authenticationHeaders, 'POST'))
}

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
		try {
			const rcAccount = await this.app.service('/rocketChat/user').getOrCreateRocketChatAccount(userId, params);

			let { authToken } = rcAccount;
			// user already logged in
			if (authToken !== '') {
				try {
					const res = await request(
						getRequestOptions('/api/v1/me', {}, false, { authToken, userId: rcAccount.rcId }, 'GET')
					);
 					await setUserStatus({authToken, userId: rcAccount.rcId}, 'offline');
					if (res.success) return { authToken };
				} catch (err) {
					authToken = '';
				}
			}

			// log in user
			const response = await request(getRequestOptions('/api/v1/users.createToken', { userId: rcAccount.rcId }, true));
			({ authToken } = response.data);
			if (response.success === true && authToken !== undefined) {
				await userModel.update({ username: rcAccount.username }, { authToken });
 				await setUserStatus({authToken, userId: rcAccount.rcId}, 'offline');
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
