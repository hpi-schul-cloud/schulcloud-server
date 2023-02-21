const { Forbidden, BadRequest } = require('../../../errors');
const { makeStringRCConform } = require('../helpers');
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

	/**
	 * creates an account, should only be called by getOrCreateRocketChatAccount
	 * @param userId sc-userid
	 */
	getOrCreateRcUser(userId) {
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
				const service = this.app.service('/nest-rocket-chat');
				const rcUserList = await service.getUserList(`query={"emails.address":"${user.email}"}`);
				let rcUser;
				if (rcUserList.users.length) {
					rcUser = rcUserList.users[0];
					await userModel.updateOne(
						{
							rcId: rcUser._id,
						},
						{ userId, username: rcUser.username, rcId: rcUser._id },
						{ upsert: true }
					);
					return userModel.findOne({ rcId: rcUser._id }).lean().exec();
				}
				const name = [user.firstName, user.lastName].join(' ');
				const username = await this.generateUserName(user);
				const password = randomPass();
				rcUser = (await service.createUser(user.email, password, username, name)).user;
				return userModel.create({
					userId,
					username: rcUser.username,
					rcId: rcUser._id,
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
				rcUser = await this.getOrCreateRcUser(userId);
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
	async onUserRemoved(context) {
		this.deleteUser(context._id);
	}

	/**
	 * removes the rocketChat user belonging to the schulcloud user given by Id
	 * @param {*} userId Id of a team in the schulcloud
	 */
	async deleteUser(userId) {
		return userModel
			.findOne({ userId })
			.then(async (user) => {
				if (user) {
					const service = this.app.service('/nest-rocket-chat');
					await service.deleteUser(user.username);
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

	findUsersRocketChatId({ userIds }) {
		if (!Array.isArray(userIds || {})) {
			return Promise.reject(new Forbidden('requires an array of userIds'));
		}
		return Promise.all(userIds.map((userId) => this.getOrCreateRocketChatAccount(userId)))
			.then((accounts) => {
				const result = accounts.map((account) => account.rcId);
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
		// this does not get called, "löschkonzept" broke that hook, but could be worse since sc-user and rc-user references eventually fix themselves
		this.app.service('users').on('removed', this.onUserRemoved.bind(this));
	}

	setup(app) {
		this.app = app;
		this.registerEventListeners();
	}
}

module.exports = RocketChatUser;
