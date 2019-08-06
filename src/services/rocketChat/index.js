const request = require('request-promise-native');
const { Forbidden, BadRequest } = require('@feathersjs/errors');
const logger = require('../../logger');
const { ROCKET_CHAT_URI, ROCKET_CHAT_ADMIN_TOKEN, ROCKET_CHAT_ADMIN_ID } = require('./rocketChatConfig');

const rocketChatModels = require('./model'); // toDo: deconstruct
const {
	rocketChatUserHooks, rocketChatLoginHooks, rocketChatLogoutHooks, rocketChatChannelHooks,
} = require('./hooks');
const docs = require('./docs');
const { randomSuffix } = require('./randomPass');
const { getRequestOptions, makeStringRCConform } = require('./helpers');

const RocketChatUser = require('./services/rocketChatUser');

if (ROCKET_CHAT_URI === undefined) { logger.warning('please set the environment variable ROCKET_CHAT_URI'); }
if (ROCKET_CHAT_ADMIN_TOKEN === undefined) {
	logger.warning('please set the environment variable ROCKET_CHAT_ADMIN_TOKEN');
}
if (ROCKET_CHAT_ADMIN_ID === undefined) { logger.warning('please set the environment variable ROCKET_CHAT_ADMIN_ID'); }

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
					await rocketChatModels.userModel.update({ username: rcAccount.username }, { authToken });
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
				logger.warning(new BadRequest('Can not create RocketChat Channel', err));
				throw new BadRequest('Can not create RocketChat Channel', err);
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
			logger.warning(new BadRequest('error initializing the rocketchat channel', err));
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
					logger.warning(new BadRequest('addUsersToChannel', err));
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
					logger.warning(new BadRequest('removeUsersFromChannel', err));
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
				logger.warning(new BadRequest('deleteChannel', err));
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
