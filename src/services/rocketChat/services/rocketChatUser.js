const request = require('request-promise-native');
const reqlib = require('app-root-path').require;

const { Forbidden, BadRequest } = reqlib('src/errors');
const { getRequestOptions, makeStringRCConform } = require('../helpers');
const { SCHOOL_FEATURES } = require('../../school/model');
const docs = require('../docs');
const { userModel } = require('../model');
const logger = require('../../../logger');
const { randomPass, randomSuffix } = require('../randomPass');

class RocketChatUser {
	constructor(options) {
		this.options = options || {};
		this.docs = docs;
	}

	generateUserName(user) {
		// toDo: implementation with bound execution time.
		const userName = makeStringRCConform(`${user.firstName}.${user.lastName}.${randomSuffix()}`);
		// toDo: check availibility in rocketChat as well.
		return userModel.findOne({ username: userName }).then((result) => {
			if (!result) {
				return userName;
			}
			return this.generateUserName(user);
		});
	}

	async handleEmailInUse(err, email, password) {
		if (err && err.error && err.error.error && err.error.error.includes('is already in use :(')) {
			// email already in use
			const queryString = `query={"emails.address":"${email}"}`;
			const rcUser = await request(getRequestOptions(`/api/v1/users.list?${queryString}`, {}, true, undefined, 'GET'));
			const updatePasswordBody = {
				userId: rcUser.users[0]._id,
				data: {
					password,
				},
			};
			return request(getRequestOptions('/api/v1/users.update', updatePasswordBody, true));
		}
		throw new BadRequest('Can not write user informations to rocketChat.', err);
	}

	/**
	 * creates an account, should only be called by getOrCreateRocketChatAccount
	 * @param {object} data
	 */
	createRocketChatAccount(userId) {
		if (userId === undefined) {
			throw new BadRequest('Missing data value.');
		}

		const internalParams = {
			query: { $populate: 'schoolId' },
		};
		return this.app
			.service('users')
			.get(userId, internalParams)
			.then(async (user) => {
				const { email } = user;
				const password = randomPass();
				let username = await this.generateUserName(user);
				const name = [user.firstName, user.lastName].join(' ');

				const body = {
					email,
					password,
					username,
					name,
					verified: true,
				};

				const createdUser = await request(getRequestOptions('/api/v1/users.create', body, true)).catch(async (err) =>
					this.handleEmailInUse(err, email, password)
				);

				const rcId = createdUser.user._id;
				({ username } = createdUser.user);
				return userModel.create({
					userId,
					username,
					rcId,
				});
			})
			.catch((err) => {
				throw new BadRequest('Can not create RocketChat Account', err);
			});
	}

	/**
	 * returns the account data for an rocketChat account, matching a given schulcloud user ID.
	 * If no matching rocketChat account exists yet, it is created
	 * @param {*} userId id of a user in the schulcloud
	 */
	async getOrCreateRocketChatAccount(userId) {
		try {
			const scUser = await this.app.service('users').get(userId, { query: { $populate: 'schoolId' } });
			if (
				!(
					(scUser.schoolId.features || []).includes(SCHOOL_FEATURES.ROCKET_CHAT) || scUser.schoolId.purpose === 'expert'
				)
			) {
				throw new BadRequest('this users school does not support rocket.chat');
			}
			let rcUser = await userModel.findOne({ userId });
			if (!rcUser) {
				rcUser = await this.createRocketChatAccount(userId);
			}
			return {
				username: rcUser.username,
				authToken: rcUser.authToken,
				rcId: rcUser.rcId,
			};
		} catch (err) {
			throw new BadRequest('could not initialize rocketchat user', err);
		}
	}

	/**
	 * react to a user being deleted
	 * @param {*} context
	 */
	static onUserRemoved(context) {
		RocketChatUser.deleteUser(context._id);
	}

	/**
	 * removes the rocketChat user belonging to the schulcloud user given by Id
	 * @param {*} userId Id of a team in the schulcloud
	 */
	static deleteUser(userId) {
		return userModel
			.findOne({ userId })
			.then(async (user) => {
				if (user) {
					await request(getRequestOptions('/api/v1/users.delete', { username: user.username }, true));
					await userModel.deleteOne({ _id: user._id });
				}
				return true;
			})
			.catch((err) => {
				logger.warning(new BadRequest('deleteUser', err));
			});
	}

	/**
	 * returns rocketChat specific data to a given schulcloud user id
	 * @param {*} userId Id of a user in the schulcloud
	 * @param {} params
	 */
	get(userId) {
		return this.getOrCreateRocketChatAccount(userId)
			.then((login) => {
				const result = login;
				delete result.password;
				return result;
			})
			.catch((err) => {
				throw new BadRequest('encountered an error while fetching a rocket.chat user.', err);
			});
	}

	/**
	 * returns the rocketChat usernames for an array of schulcloud userIds
	 * @param {object} params an object containing an array `userIds`
	 */
	find({ userIds }) {
		// toDo: optimize to generate less requests
		if (!Array.isArray(userIds || {})) {
			return Promise.reject(new Forbidden('requires an array of userIds'));
		}
		return Promise.all(userIds.map((userId) => this.getOrCreateRocketChatAccount(userId)))
			.then((accounts) => {
				const result = accounts.map((account) => account.username);
				return result;
			})
			.catch((err) => {
				throw new BadRequest(err);
			});
	}

	/**
	 * Register methods of the service to listen to events of other services
	 * @listens users:removed
	 */
	registerEventListeners() {
		this.app.service('users').on('removed', RocketChatUser.onUserRemoved.bind(this));
	}

	setup(app) {
		this.app = app;
		this.registerEventListeners();
	}
}

module.exports = RocketChatUser;
