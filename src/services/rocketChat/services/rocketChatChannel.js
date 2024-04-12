const request = require('request-promise-native');
const { BadRequest } = require('../../../errors');
const { makeStringRCConform } = require('../helpers');
const { TEAM_FEATURES } = require('../../teams/model');
const { randomSuffix } = require('../randomPass');
const { channelModel } = require('../model');
const docs = require('../docs');
const logger = require('../../../logger');
const { asyncErrorLog } = require('../../../errors/utils');

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

	/**
	 * generate a unique channel name that doesnt exist on rocket.chat yet, by adding a suffix to the given String.
	 * @param {String} teamName
	 */
	generateChannelName(teamName) {
		// toDo: implementation with bound execution time.
		const channelName = makeStringRCConform(`${teamName}.${randomSuffix()}`);
		// toDo: check availibility in rocketChat as well.
		return channelModel.findOne({ channelName }).then((result) => {
			if (!result) {
				return Promise.resolve(channelName);
			}
			return this.generateChannelName(teamName);
		});
	}

	/**
	 * create a channel for a given teamId.
	 * WARNING: the second parameter should only be used if you are sure that name is not taken!
	 * @param {ObjectId} teamId
	 * @param {String} [name] Optional - the channel will be created with this name.
	 * Will throw an error if name is already used.
	 */
	createChannel(teamId, name) {
		if (teamId === undefined) {
			throw new BadRequest('Missing data value.');
		}

		let currentTeam;
		const internalParams = {
			query: { $populate: 'schoolId' },
		};
		return this.app
			.service('teams')
			.get(teamId, internalParams)
			.then((team) => {
				currentTeam = team;
				const userNamePromises = currentTeam.userIds.map((user) =>
					this.app
						.service('rocketChat/user')
						.get(user.userId)
						.catch(() => Promise.resolve)
				);
				return Promise.all(userNamePromises).then(async (users) => {
					const userNames = [];
					users.forEach((user) => {
						if (user.username) userNames.push(user.username);
					});
					const channelName = name || (await this.generateChannelName(currentTeam.name));
					const service = this.app.service('/nest-rocket-chat');
					return service.createGroup(channelName, userNames);
				});
			})
			.then((result) => {
				if (name) {
					// channel already exists in database
					return channelModel.findOne({ teamId }).lean().exec();
				}
				const channelData = {
					teamId: currentTeam._id,
					channelName: result.group.name,
				};
				return channelModel.create(channelData);
			})
			.catch((err) => {
				logger.warning(new BadRequest('Can not create RocketChat Channel', err));
				throw new BadRequest('Can not create RocketChat Channel', err);
			});
	}

	/**
	 * error handler for requesting the members of a channel, creating the channel anew if it doesnt exist on RC-side.
	 * @param {Error} err
	 * @param {Object} channel a channel Document from the sc-database
	 * @param {ObjectId} teamId
	 */
	async handleChannelMissingRcSide(err, channel, teamId) {
		const rcError = err.error.errorType;
		if (rcError === 'error-room-not-found') {
			await this.createChannel(teamId, channel.channelName);
			return this.app.service('/nest-rocket-chat').getGroupMembers(channel.channelName);
		}
		throw err;
	}

	/**
	 * ensures that
	 * - the channel exists on rocket.chat side.
	 * - the user is in the channel on rocket.chat side.
	 * @param {Object} channel a channel document from the sc-database
	 * @param {ObjectId} userId
	 * @param {ObjectId} teamId
	 */
	async ensureUserIsInRcChannel(channel, userId, teamId) {
		const rcAccount = await this.app.service('/rocketChat/user').get(userId);
		const service = this.app.service('/nest-rocket-chat');
		const rcChannelMembers = await service
			.getGroupMembers(channel.channelName)
			.catch((err) => this.handleChannelMissingRcSide(err, channel, teamId));

		const userInChannel = !!rcChannelMembers.members.find((e) => e._id === rcAccount.rcId);
		if (!userInChannel) {
			await service.inviteUserToGroup(channel.channelName, rcAccount.rcId);
		}
		return Promise.resolve();
	}

	/**
	 * returns a channel for a given sc-teamId, creating one if it doesnt exist yet.
	 * @param {ObjectId} teamId
	 * @param {Object} params
	 */
	async getOrCreateRocketChatChannel(teamId, params) {
		try {
			let channel = await channelModel.findOne({ teamId });
			if (!channel) {
				channel = await this.createChannel(teamId);
			}
			// tis this even the right place to check this?
			if (params && params.account && params.account.userId) {
				// check that channel exists in rocketchat, and user is part of it.
				await this.ensureUserIsInRcChannel(channel, params.account.userId, teamId);
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

	/**
	 * adds all users in the userIds to the channel belonging to the team given by id.
	 * @param {Array} userIds array of sc-userIds.
	 * @param {ObjectId} teamId
	 */
	async addUsersToChannel(userIds, teamId) {
		const rcUserNames = await this.app.service('/rocketChat/user').find({ userIds });
		const channel = await this.app.service('/rocketChat/channel').get(teamId);
		const service = this.app.service('/nest-rocket-chat');

		const invitationPromises = rcUserNames.map((userName) =>
			service.inviteUserToGroup(channel.channelName, userName).catch((err) => {
				logger.warning(new BadRequest('addUsersToChannel', err));
			})
		);
		return Promise.all(invitationPromises);
	}

	/**
	 * removes all users in the userIds from the channel belonging to the sc-team given by id.
	 * @param {Array} userIds array of sc-userIds.
	 * @param {ObjectId} teamId
	 */
	async removeUsersFromChannel(userIds, teamId) {
		const rcUserIds = await this.app.service('/rocketChat/user').findUsersRocketChatId({ userIds });
		const channel = await this.app.service('/rocketChat/channel').get(teamId);
		const service = this.app.service('/nest-rocket-chat');

		const kickPromises = rcUserIds.map((userName) =>
			service.kickUserFromGroup(channel.channelName, userName).catch((err) => {
				logger.warning(new BadRequest('removeUsersFromChannel', err));
			})
		);
		return Promise.all(kickPromises);
	}

	/**
	 * removes the channel belonging to the team given by Id
	 * @param {objectId} teamId Id of a team in the schulcloud
	 */
	async deleteChannel(teamId) {
		return channelModel
			.findOne({ teamId })
			.then(async (channel) => {
				if (channel) {
					const service = this.app.service('/nest-rocket-chat');
					await service.deleteGroup(channel.channelName);
					await channelModel.deleteOne({ _id: channel._id });
				}
				return Promise.resolve();
			})
			.catch((err) => {
				logger.warning(new BadRequest('deleteChannel', err));
			});
	}

	/**
	 * archives the channel belonging to a sc-teamId in rocketchat.
	 * @param {objectId} teamId
	 */
	async archiveChannel(teamId) {
		const channel = await channelModel.findOne({ teamId });
		if (channel) {
			const service = this.app.service('/nest-rocket-chat');
			await service.archiveGroup(channel.channelName);
		}
		return Promise.resolve();
	}

	/**
	 * unarchives the channel belonging to a sc-teamId in rocketchat.
	 * @param {objectId} teamId
	 */
	async unarchiveChannel(teamId) {
		const channel = await channelModel.findOne({ teamId });
		if (channel) {
			const service = this.app.service('/nest-rocket-chat');
			await service.unarchiveGroup(channel.channelName);
		}
		return Promise.resolve();
	}

	/**
	 * synchronizes channel moderators between rocketchat and schulcloud, for a give teamId.
	 * @param {objectId} teamId
	 */
	async synchronizeModerators(teamId) {
		try {
			const getRoles = await this.app.service('roles').find({
				query: { name: { $in: ['teamowner', 'teamadministrator'] } },
			});
			const teamModeratorRoles = getRoles.data.map((role) => role._id.toString());
			const team = await this.app.service('teams').get(teamId);
			const channel = await channelModel.findOne({ teamId });
			if (channel) {
				const service = this.app.service('/nest-rocket-chat');
				const rcResponse = await service.getGroupModerators(channel.channelName);
				let rcChannelModerators = rcResponse.moderators;
				const scModeratorPromises = [];
				team.userIds.forEach(async (user) => {
					if (teamModeratorRoles.includes(user.role.toString())) {
						scModeratorPromises.push(this.app.service('rocketChat/user').get(user.userId));
					}
				});
				let scModerators = await Promise.all(scModeratorPromises);
				rcChannelModerators = rcChannelModerators.map((mod) => mod._id);
				scModerators = scModerators.map((mod) => mod.rcId);
				const moderatorsToAdd = scModerators.filter((x) => !rcChannelModerators.includes(x));
				const moderatorsToRemove = rcChannelModerators.filter((x) => !scModerators.includes(x));
				moderatorsToAdd.forEach((x) => service.addGroupModerator(channel.channelName, x));
				moderatorsToRemove.forEach((x) => service.removeGroupModerator(channel.channelName, x));
			}
			return Promise.resolve();
		} catch (err) {
			logger.warning(`Fehler beim Synchronisieren der rocket.chat moderatoren für team ${teamId} `, err);
			return Promise.reject(err);
		}
	}

	/**
	 * returns an existing or new rocketChat channel for a given Team ID, and ensures validity of the channel first.
	 * @param {*} teamId Id of a Team in the schulcloud
	 * @param {*} params
	 */
	async get(teamId, params) {
		const result = await this.getOrCreateRocketChatChannel(teamId, params);
		await this.synchronizeModerators(teamId);
		return result;
	}

	async onTeamPatched(result) {
		console.log('>>>onTeamPatched', JSON.stringify(result.features));

		try {
			if (result.features.includes(TEAM_FEATURES.ROCKET_CHAT)) {
				await this.unarchiveChannel(result._id);
				await this.synchronizeModerators(result._id);
			} else {
				await this.archiveChannel(result._id);
			}
		} catch (err) {
			asyncErrorLog(err, 'An error was thrown in onTeamPatched event.');
		}
	}

	/**
	 * React to event published by the Team service when users are added or
	 * removed to a team.
	 * @param {Object} context event context given by the Team service
	 */
	onTeamUsersChanged(context) {
		console.log('>>>onTeamUsersChanged', JSON.stringify(context.features));

		const { team } = (context || {}).additionalInfosTeam || {};
		let additionalUsers = (((context || {}).additionalInfosTeam || {}).changes || {}).add;
		let removedUsers = (((context || {}).additionalInfosTeam || {}).changes || {}).remove;

		additionalUsers = additionalUsers.map((user) => user.userId);
		removedUsers = removedUsers.map((user) => user.userId);

		if (additionalUsers.length > 0) this.addUsersToChannel(additionalUsers, team._id);
		if (removedUsers.length > 0) this.removeUsersFromChannel(removedUsers, team._id);
	}

	/**
	 * react to a team being deleted
	 * @param {*} context
	 */
	async onRemoved(context) {
		console.log('>>>onRemoved', console.log(JSON.stringify(context.features));

		this.deleteChannel(context._id);
	}

	/**
	 * Register methods of the service to listen to events of other services
	 * @listens teams:after:usersChanged
	 * @listens teams:removed
	 */
	registerEventListeners() {
		this.app.on('teams:after:usersChanged', this.onTeamUsersChanged.bind(this)); // use hook to get app
		this.app.service('teams').on('removed', this.onRemoved.bind(this));
		this.app.service('teams').on('patched', this.onTeamPatched.bind(this));
	}

	setup(app) {
		this.app = app;
		this.registerEventListeners();
	}
}

module.exports = RocketChatChannel;
