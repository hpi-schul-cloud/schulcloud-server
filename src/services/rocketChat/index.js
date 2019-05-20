const request = require('request-promise-native');
const { Forbidden, BadRequest } = require('@feathersjs/errors');
const logger = require('winston');
const { ROCKET_CHAT_URI, ROCKET_CHAT_ADMIN_TOKEN, ROCKET_CHAT_ADMIN_ID } = require('./rocketChatConfig');

const rocketChatModels = require('./model'); // toDo: deconstruct
const {
	rocketChatUserHooks, rocketChatLoginHooks, rocketChatLogoutHooks, rocketChatChannelHooks,
} = require('./hooks');
const docs = require('./docs');
const { randomPass, randomSuffix } = require('./randomPass');


const REQUEST_TIMEOUT = 4000; // in ms

if (ROCKET_CHAT_URI === undefined) { logger.warn('please set the environment variable ROCKET_CHAT_URI'); }
if (ROCKET_CHAT_ADMIN_TOKEN === undefined) {
	logger.warn('please set the environment variable ROCKET_CHAT_ADMIN_TOKEN');
}
if (ROCKET_CHAT_ADMIN_ID === undefined) { logger.warn('please set the environment variable ROCKET_CHAT_ADMIN_ID'); }

/**
 * create a valid options object to call a rocketChat request.
 * @param {String} shortUri Uri of the Rocket.Chat endpoint. Example: '/api/v1/users.register'
 * @param {Object} body Body of the request, as required by the rocket.chat API
 * @param {Boolean} asAdmin If true, request will be sent with admin privileges,
 * and auth field will be ignored.
 * @param {Object} auth optional, object of the form {authToken, userId}.
 * @param {String} method the REST method to be called. Example: 'POST'.
 */
const getRequestOptions = (shortUri, body, asAdmin, auth, method) => {
	let headers;
	if (asAdmin) {
		headers = {
			'X-Auth-Token': ROCKET_CHAT_ADMIN_TOKEN,
			'X-User-ID': ROCKET_CHAT_ADMIN_ID,
		};
	} else if (auth) {
		headers = {
			'X-Auth-Token': auth.authToken,
			'X-User-ID': auth.userId,
		};
	}
	return {
		uri: ROCKET_CHAT_URI + shortUri,
		method: method || 'POST',
		body,
		headers,
		json: true,
		timeout: REQUEST_TIMEOUT,
	};
};

const makeStringRCConform = (input) => {
	const dict = {
		ä: 'ae', Ä: 'Ae', ö: 'oe', Ö: 'Oe', ü: 'ue', Ü: 'Ue', ' ': '-', ß: 'ss',
	};
	return input.replace(/[äÄöÖüÜß ]/g, match => dict[match]);
};

/**
 * service that maps schulcloud users to rocketChat users.
 *
 * Other services should only get (or find) users they need, creation and deletion of RC users is
 * handled automatically by the service.
 */
class RocketChatUser {
	constructor(options) {
		this.options = options || {};
		this.docs = docs;
	}

	generateUserName(user) {
		// toDo: implementation with bound execution time.
		const userName = makeStringRCConform(`${user.firstName}.${user.lastName}.${randomSuffix()}`);
		// toDo: check availibility in rocketChat as well.
		return rocketChatModels.userModel.findOne({ username: userName })
			.then((result) => {
				if (!result) {
					return Promise.resolve(userName);
				} return this.generateUserName(user);
			});
	}

	/**
	 * creates an account, should only be called by getOrCreateRocketChatAccount
	 * @param {object} data
	 */
	createRocketChatAccount(userId) {
		if (userId === undefined) { throw new BadRequest('Missing data value.'); }

		const internalParams = {
			query: { $populate: 'schoolId' },
		};
		return this.app.service('users').get(userId, internalParams).then(async (user) => {
			const { email } = user;
			const pass = randomPass();
			let username = await this.generateUserName(user);
			const name = [user.firstName, user.lastName].join(' ');

			const body = {
				email, pass, username, name,
			};

			const createdUser = await request(getRequestOptions('/api/v1/users.register', body))
				.catch(async (err) => {
					if (err.error.error === 'Email already exists. [403]') {
						const queryString = `query={"emails.address":"${email}"}`;
						const rcUser = await request(getRequestOptions(`/api/v1/users.list?${queryString}`,
							{}, true, undefined, 'GET'));
						const updatePasswordBody = {
							userId: rcUser.users[0]._id,
							data: {
								password: pass,
							},
						};
						return request(getRequestOptions('/api/v1/users.update', updatePasswordBody, true));
					}
					throw new BadRequest('Can not write user informations to rocketChat.', err);
				});
			const rcId = createdUser.user._id;
			({ username } = createdUser.user);
			return rocketChatModels.userModel.create({
				userId, pass, username, rcId,
			});
		}).catch((err) => {
			logger.warn(new BadRequest('Can not create RocketChat Account', err));
			throw new BadRequest('Can not create RocketChat Account');
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
			if (!((scUser.schoolId.features || []).includes('rocketChat') || scUser.schoolId.purpose === 'expert')) {
				throw new BadRequest('this users school does not support rocket.chat');
			}
			let rcUser = await rocketChatModels.userModel.findOne({ userId });
			if (!rcUser) {
				rcUser = await this.createRocketChatAccount(userId)
					.then(rocketChatModels.userModel.findOne({ userId }));
			}
			return {
				username: rcUser.username,
				password: rcUser.pass,
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
		return rocketChatModels.userModel.findOne({ userId })
			.then(async (user) => {
				if (user) {
					await request(getRequestOptions('/api/v1/users.delete', { username: user.username }, true));
					await rocketChatModels.userModel.deleteOne({ _id: user._id });
				}
				return Promise.resolve();
			})
			.catch((err) => {
				logger.warn(new BadRequest('deleteUser', err));
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
				return Promise.resolve(result);
			}).catch((err) => {
				logger.warn(new Forbidden('Can not create token.', err));
				throw new Forbidden('Can not create token.', err);
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
		return Promise.all(userIds.map(userId => this.getOrCreateRocketChatAccount(userId)))
			.then((accounts) => {
				const result = accounts.map(account => account.username);
				return Promise.resolve(result);
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
				const loginResponse = await request(getRequestOptions('/api/v1/login', login));
				const newToken = (loginResponse.data || {}).authToken;
				authToken = newToken;
				if (loginResponse.status === 'success' && authToken !== undefined) {
					await rocketChatModels.userModel.update({ username: rcAccount.username }, { authToken });
					return Promise.resolve({ authToken });
				} return Promise.reject(new BadRequest('False response data from rocketChat'));
			}).catch((err) => {
				logger.warn(new Forbidden('Can not create token.', err));
				throw new Forbidden('Can not create token.');
			});
	}

	setup(app) {
		this.app = app;
	}
}

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
				await rocketChatModels.userModel.update({ username: rcUser.username }, { authToken: '' });
				await request(getRequestOptions('/api/v1/logout', {}, false, headers));
			}
			return ('success');
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

/**
 * Service that maps schulcloud teams to rocketChat groups.
 *
 * Other services should only get groups by the id of the corresponding team,
 * creation and deletion of RC groups is handled automatically by the service.
 */
class RocketChatChannel {
	constructor(options) {
		this.options = options || {};
		this.docs = docs;
	}

	generateChannelName(team) {
		// toDo: implementation with bound execution time.
		const channelName = makeStringRCConform(`${team.name}.${randomSuffix()}`);
		// toDo: check availibility in rocketChat as well.
		return rocketChatModels.channelModel.findOne({ channelName })
			.then((result) => {
				if (!result) {
					return Promise.resolve(channelName);
				} return this.generateChannelName(team);
			});
	}

	createChannel(teamId) {
		if (teamId === undefined) { throw new BadRequest('Missing data value.'); }

		let currentTeam;
		const internalParams = {
			query: { $populate: 'schoolId' },
		};
		return this.app.service('teams').get(teamId, internalParams)
			.then((team) => {
				currentTeam = team;
				const userNamePromises = currentTeam.userIds.map(user => this.app.service('rocketChat/user')
					.get(user.userId)
					.catch(() => Promise.resolve));
				return Promise.all(userNamePromises).then(async (users) => {
					const userNames = [];
					users.forEach((user) => {
						if (user.username) userNames.push(user.username);
					});
					const channelName = await this.generateChannelName(currentTeam);
					const body = {
						name: channelName,
						members: userNames,
					};
					return request(getRequestOptions('/api/v1/groups.create', body, true))
						.then((res) => {
							if (res.success === true) return res;
							return Promise.reject(new BadRequest('bad answer on group creation'));
						});
				});
			}).then((result) => {
				const channelData = {
					teamId: currentTeam._id,
					channelName: result.group.name,
				};
				return rocketChatModels.channelModel.create(channelData);
			})
			.then(result => this.synchronizeModerators(currentTeam).then(() => result))
			.catch((err) => {
				logger.warn(new BadRequest('Can not create RocketChat Channel', err));
				throw new BadRequest('Can not create RocketChat Channel');
			});
	}

	async getOrCreateRocketChatChannel(teamId, params) {
		try {
			let channel = await rocketChatModels.channelModel.findOne({ teamId });
			if (!channel) {
				channel = await this.createChannel(teamId, params)
					.then(() => rocketChatModels.channelModel.findOne({ teamId }));
			}
			return {
				teamId: channel.teamId,
				channelName: channel.channelName,
			};
		} catch (err) {
			logger.warn(new BadRequest('error initializing the rocketchat channel', err));
			return new BadRequest('error initializing the rocketchat channel', err);
		}
	}

	async addUsersToChannel(userIds, teamId) {
		const rcUserNames = await this.app.service('/rocketChat/user').find({ userIds });
		const channel = await this.app.service('/rocketChat/channel').get(teamId);

		const invitationPromises = rcUserNames.map((userName) => {
			const body = {
				roomName: channel.channelName,
				username: userName,
			};
			return request(getRequestOptions('/api/v1/groups.invite', body, true))
				.catch((err) => {
					logger.warn(new BadRequest('addUsersToChannel', err));
				});
		});
		return Promise.all(invitationPromises);
	}

	async removeUsersFromChannel(userIds, teamId) {
		const rcUserNames = await this.app.service('/rocketChat/user').find({ userIds });
		const channel = await this.app.service('/rocketChat/channel').get(teamId);

		const kickPromises = rcUserNames.map((userName) => {
			const body = {
				roomName: channel.channelName,
				username: userName,
			};
			return request(getRequestOptions('/api/v1/groups.kick', body, true))
				.catch((err) => {
					logger.warn(new BadRequest('removeUsersFromChannel', err));
				});
		});
		return Promise.all(kickPromises);
	}

	/**
	 * removes the channel belonging to the team given by Id
	 * @param {*} teamId Id of a team in the schulcloud
	 */
	static deleteChannel(teamId) {
		return rocketChatModels.channelModel.findOne({ teamId })
			.then(async (channel) => {
				if (channel) {
					await request(getRequestOptions('/api/v1/groups.delete', { roomName: channel.channelName }, true));
					await rocketChatModels.channelModel.deleteOne({ _id: channel._id });
				}
				return Promise.resolve();
			})
			.catch((err) => {
				logger.warn(new BadRequest('deleteChannel', err));
			});
	}

	static async archiveChannel(teamId) {
		const channel = await rocketChatModels.channelModel.findOne({ teamId });
		if (channel) {
			await request(getRequestOptions('/api/v1/groups.archive', { roomName: channel.channelName }, true));
		}
		return Promise.resolve();
	}

	static async unarchiveChannel(teamId) {
		const channel = await rocketChatModels.channelModel.findOne({ teamId });
		if (channel) {
			await request(getRequestOptions('/api/v1/groups.unarchive', { roomName: channel.channelName }, true));
		}
		return Promise.resolve();
	}

	async synchronizeModerators(team) {
		try {
			const channel = await this.app.service('/rocketChat/channel').get(team._id);
			const rcResponse = await request(getRequestOptions(
				`/api/v1/groups.moderators?roomName=${channel.channelName}`,
				{},
				true,
				undefined,
				'GET',
			));
			let rcChannelModerators = rcResponse.moderators;
			const scModeratorPromises = [];
			team.userIds.forEach(async (user) => {
				if (this.teamModeratorRoles.includes(user.role.toString())) {
					scModeratorPromises.push(this.app.service('rocketChat/user').get(user.userId));
				}
			});
			let scModerators = await Promise.all(scModeratorPromises);
			rcChannelModerators = rcChannelModerators.map(mod => mod._id);
			scModerators = scModerators.map(mod => mod.rcId);
			const moderatorsToAdd = scModerators.filter(x => !rcChannelModerators.includes(x));
			const moderatorsToRemove = rcChannelModerators.filter(x => !scModerators.includes(x));
			moderatorsToAdd.forEach(x => request(getRequestOptions(
				'/api/v1/groups.addModerator', { roomName: channel.channelName, userId: x }, true,
			)));
			moderatorsToRemove.forEach(x => request(getRequestOptions(
				'/api/v1/groups.removeModerator', { roomName: channel.channelName, userId: x }, true,
			)));
			return Promise.resolve();
		} catch (err) {
			logger.log(`Fehler beim Synchronisieren der rocket.chat moderatoren für team ${team._id} `, err);
			return Promise.reject(err);
		}
	}

	/**
	 * returns an existing or new rocketChat channel for a given Team ID
	 * @param {*} teamId Id of a Team in the schulcloud
	 * @param {*} params
	 */
	get(teamId, params) {
		return this.getOrCreateRocketChatChannel(teamId, params);
	}

	async onTeamPatched(result) {
		if (result.features.includes('rocketChat')) {
			await RocketChatChannel.unarchiveChannel(result._id);
			await this.synchronizeModerators(result);
		} else {
			RocketChatChannel.archiveChannel(result._id);
		}
	}

	/**
	 * React to event published by the Team service when users are added or
	 * removed to a team.
	 * @param {Object} context event context given by the Team service
	 */
	onTeamUsersChanged(context) {
		const { team } = ((context || {}).additionalInfosTeam || {});
		let additionalUsers = (((context || {}).additionalInfosTeam || {}).changes || {}).add;
		let removedUsers = (((context || {}).additionalInfosTeam || {}).changes || {}).remove;

		additionalUsers = additionalUsers.map(user => user.userId);
		removedUsers = removedUsers.map(user => user.userId);

		if (additionalUsers.length > 0) this.addUsersToChannel(additionalUsers, team._id);
		if (removedUsers.length > 0) this.removeUsersFromChannel(removedUsers, team._id);
	}

	/**
	 * react to a team being deleted
	 * @param {*} context
	 */
	static onRemoved(context) {
		RocketChatChannel.deleteChannel(context._id);
	}

	/**
	 * Register methods of the service to listen to events of other services
	 * @listens teams:after:usersChanged
	 * @listens teams:removed
	 */
	registerEventListeners() {
		this.app.on('teams:after:usersChanged', this.onTeamUsersChanged.bind(this)); // use hook to get app
		this.app.service('teams').on('removed', RocketChatChannel.onRemoved.bind(this));
		this.app.service('teams').on('patched', this.onTeamPatched.bind(this));
	}


	setup(app) {
		this.app = app;
		this.registerEventListeners();
		return app.service('roles').find({
			query: { name: { $in: ['teamowner', 'teamadministrator'] } },
		}).then((teamModeratorRoles) => {
			this.teamModeratorRoles = teamModeratorRoles.data.map(role => role._id.toString());
			return Promise.resolve();
		});
	}
}

module.exports = function Setup() {
	const app = this;

	app.use('/rocketChat/channel', new RocketChatChannel());
	app.use('/rocketChat/user', new RocketChatUser());
	app.use('/rocketChat/login', new RocketChatLogin());
	app.use('/rocketChat/logout', new RocketChatLogout());

	const rocketChatUserService = app.service('/rocketChat/user');
	const rocketChatLoginService = app.service('/rocketChat/login');
	const rocketChatLogoutService = app.service('rocketChat/logout');
	const rocketChatChannelService = app.service('/rocketChat/channel');

	rocketChatUserService.hooks(rocketChatUserHooks);
	rocketChatLoginService.hooks(rocketChatLoginHooks);
	rocketChatLogoutService.hooks(rocketChatLogoutHooks);
	rocketChatChannelService.hooks(rocketChatChannelHooks);
};
