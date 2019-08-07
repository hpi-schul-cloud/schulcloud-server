const { Forbidden, BadRequest } = require('@feathersjs/errors');
const request = require('request-promise-native');

const { getRequestOptions } = require('../helpers');
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
	get(userId, params) {
		if (userId.toString() !== params.account.userId.toString()) {
			return Promise.reject(new Forbidden('you may only log into your own rocketChat account'));
		}
		return this.app.service('/rocketChat/user').getOrCreateRocketChatAccount(userId, params)
			.then(async (rcAccount) => {
				let { authToken } = rcAccount;
				if (authToken !== '') {
					try {
						const res = await request(getRequestOptions('/api/v1/me',
							{}, false, { authToken, userId: rcAccount.rcId }, 'GET'));
						if (res.success) return { authToken };
					} catch (err) {
						authToken = '';
					}
				}
				const login = {
					user: rcAccount.username,
					password: rcAccount.password,
				};
				const loginResponse = await request(getRequestOptions('/api/v1/login', login))
					.catch(async (err) => {
						if (err.error.error === 'Unauthorized') {
							const queryString = `username=${rcAccount.username}`;
							const rcUser = await request(getRequestOptions(`/api/v1/users.info?${queryString}`,
								{}, true, undefined, 'GET'));
							const updatePasswordBody = {
								userId: rcUser.user._id,
								data: {
									password: rcAccount.password,
								},
							};
							await request(getRequestOptions('/api/v1/users.update', updatePasswordBody, true));
							return request(getRequestOptions('/api/v1/login', login));
						}
						throw new BadRequest('Login to rocketchat failed', err);
					});
				const newToken = (loginResponse.data || {}).authToken;
				authToken = newToken;
				if (loginResponse.status === 'success' && authToken !== undefined) {
					await userModel.update({ username: rcAccount.username }, { authToken });
					return Promise.resolve({ authToken });
				} return Promise.reject(new BadRequest('False response data from rocketChat'));
			}).catch((err) => {
				logger.warning(new Forbidden('Can not create token.', err));
				throw new Forbidden('Can not create token.', err);
			});
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = RocketChatLogin;
