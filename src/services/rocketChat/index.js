const request = require('request-promise-native');
//const service = require('feathers-mongoose');
const errors = require('feathers-errors');
const logger = require('winston');

const rocketChatModels = require('./model');
const hooks = require('./hooks');
const docs = require('./docs');
const { randomPass } = require('./randomPass');


const REQUEST_TIMEOUT = 4000; // in ms
const ROCKET_CHAT_URI = process.env.ROCKET_CHAT;

if (ROCKET_CHAT_URI === undefined)
    throw new errors.NotImplemented('Please set process.env.ROCKET_CHAT.');

class RocketChatUser {
    constructor(options) {
        this.options = options || {};
        this.docs = docs;
    }

    getOptions(shortUri, body, method) {
        return {
            uri: ROCKET_CHAT_URI + shortUri,
            method: method || 'POST',
            body,
            json: true,
            timeout: REQUEST_TIMEOUT
        };
    }

    getAdministratorOptions(shortUri, body, method) {
        return {
            uri: ROCKET_CHAT_URI + shortUri,
            method: method || 'POST',
            headers: {
                //'X-Auth-Token': '2_5rp4YRBnJ0q9asWFY-lEqeBalK94DoOwrgpsxYvhd',
                //'X-User-ID': "6NHge4r7Rtb2pwofe"
                'X-Auth-Token': process.env.ROCKET_CHAT_ADMIN_TOKEN,
                'X-User-ID': process.env.ROCKET_CHAT_ADMIN_ID
            },
            body,
            json: true,
            timeout: REQUEST_TIMEOUT
        };
    }

    /**
     * 
     * @param {object} data 
     * @param {*} params 
     */
    createRocketChatAccount(userId) {
        if (userId === undefined)
            throw new errors.BadRequest('Missing data value.');

        const internalParams = {
            query: { $populate: "schoolId" }
        };
        return this.app.service('users').get(userId, internalParams).then(user => {
            const email = user.email;
            const pass = randomPass();
            const username = ([user.schoolId.name, user.firstName, user.lastName].join('.')).replace(/\s/g, '_');
            const name = [user.firstName, user.lastName].join('.');

            return rocketChatModels.userModel.create({ userId, pass, username }).then((res) => {
                if (res.errors !== undefined)
                    throw new errors.BadRequest('Can not insert into collection.', res.errors);

                const body = { email, pass, username, name };
                return request(this.getOptions('/api/v1/users.register', body)).then(res => {
                    if (res.success === true && res.user !== undefined)
                        return res;
                    else
                        throw new errors.BadRequest('False response data from rocketChat');
                }).catch(err => {
                    throw new errors.BadRequest('Can not write user informations to rocketChat.', err);
                });
            });
        }).catch(err => {
            logger.warn(err);
            throw new errors.BadRequest('Can not create RocketChat Account');
        });
    }

    /**
     * returns the account data for an rocketChat account, matching a given schulcloud user ID.
     * If no matching rocketChat account exists yet, it is created
     * @param {*} userId id of a user in the schulcloud
     */
    getOrCreateRocketChatAccount(userId) {
        return rocketChatModels.userModel.findOne({ userId })
        .then(login => {
            if (!login) {
                return this.createRocketChatAccount(userId)
                .then(res => {
                    return rocketChatModels.userModel.findOne({ userId })
                })
            } else return Promise.resolve(login);
        })
        .then(login => {
            return Promise.resolve({ username: login.username, password: login.pass });
        }).catch(err => {
            logger.warn(err);
            Promise.reject(new errors.BadRequest('could not initialize rocketchat user', err));
        });
    }

    /**
     * react to a user being deleted
     * @param {*} context 
     */
    _onUserRemoved(context) {
        this.deleteUser(context._id);
    }

    /**
     * removes the rocketChat user belonging to the schulcloud user given by Id
     * @param {*} userId Id of a team in the schulcloud
     */
    deleteUser(userId) {
        return rocketChatModels.userModel.findOne({userId})
        .then(async user => {
            if (user) {
                let res = await request(this.getAdministratorOptions('/api/v1/users.delete', {username: user.username}));
                console.log(res);
                await rocketChatModels.userModel.deleteOne({_id: user._id});
            }
            return Promise.resolve();
        })
        .catch(err => {
            logger.warn(err);
        })
    }

    /**
     * returns rocketChat specific data to a given schulcloud user id
     * @param {*} userId Id of a user in the schulcloud
     * @param {} params 
     */
    get(userId, params) {
        return this.getOrCreateRocketChatAccount(userId)
        .then(login => {
            delete login.password;
            return Promise.resolve(login);
        }).catch(err => {
            logger.warn(err);
            throw new errors.Forbidden('Can not create token.');
        });
    }

    /**
     * returns the rocketChat usernames for an array of schulcloud userIds
     * @param {object} params an object containing an array `userIds`
     */
    find({userIds}) {
        //toDo: optimize to generate less requests
        if (!Array.isArray(userIds || {})) {
            return Promise.reject("requires an array of userIds")
        }
        return Promise.all(userIds.map(userId => {
            return this.getOrCreateRocketChatAccount(userId)
        }))
        .then(accounts => {
            let result = accounts.map(accounts => {
                return accounts.username;
            })
            return Promise.resolve(result)
        })
        .catch(err => {
            throw new errors.BadRequest(err)
        })
    }

    /**
     * Register methods of the service to listen to events of other services
     * @listens users:removed
     */
    _registerEventListeners() {
        this.app.service('users').on('removed', this._onUserRemoved.bind(this));
    }

    setup(app, path) {
        this.app = app;
        this._registerEventListeners();
    }
}

class RocketChatLogin {
    constructor(options) {
        this.options = options || {};
        this.docs = docs;
    }

    getOptions(shortUri, body, method) {
        return {
            uri: ROCKET_CHAT_URI + shortUri,
            method: method || 'POST',
            body,
            json: true,
            timeout: REQUEST_TIMEOUT
        };
    }

    /**
     * Logs in a user given by his Id
     * @param {*} userId Id of a user in the schulcloud
     * @param {*} params 
     */
    get(userId, params) {
        return this.app.service('/rocketChat/user').getOrCreateRocketChatAccount(userId, params)
        .then(login => {
            return request(this.getOptions('/api/v1/login', login)).then(res => {
                const authToken = (res.data || {}).authToken;
                if (res.status === "success" && authToken !== undefined)
                    return Promise.resolve({ authToken });
                else
                    return Promise.reject(new errors.BadRequest('False response data from rocketChat'));
            }).catch(err => {
                return Promise.reject(new errors.Forbidden('Can not take token from rocketChat.', err));
            });
        }).catch(err => {
            logger.warn(err);
            throw new errors.Forbidden('Can not create token.');
        });
    }

    setup(app, path) {
        this.app = app;
    }
}

class RocketChatChannel {
    constructor(options) {
        this.options = options || {};
        this.docs = docs;
    }

    getOptions(shortUri, body, method) {
        return {
            uri: ROCKET_CHAT_URI + shortUri,
            method: method || 'POST',
            headers: {
                //'X-Auth-Token': '2_5rp4YRBnJ0q9asWFY-lEqeBalK94DoOwrgpsxYvhd',
                //'X-User-ID': "6NHge4r7Rtb2pwofe"
                'X-Auth-Token': process.env.ROCKET_CHAT_ADMIN_TOKEN,
                'X-User-ID': process.env.ROCKET_CHAT_ADMIN_ID
            },
            body,
            json: true,
            timeout: REQUEST_TIMEOUT
        };
    }

    createChannel(teamId, params) {
        if (teamId === undefined)
            throw new errors.BadRequest('Missing data value.');

        let currentTeam;
        const internalParams = {
            query: { $populate: "schoolId" }
        };
        return this.app.service('teams').get(teamId, internalParams)
        .then(team => {
            currentTeam = team;
            let userNamePromises = currentTeam.userIds.map(user => {
                return this.app.service('rocketChat/user').get(user.userId);
            });

            return Promise.all(userNamePromises).then(users => {
                users = users.map(user => { return user.username; });
                const body = { 
                    name: currentTeam.name,
                    members: users
                };
                return request(this.getOptions('/api/v1/groups.create', body))
                .then(res => {
                    if (res.success === true) return res;
                    else return Promise.reject("bad answer on group creation")
                })
            })
        }).then(result => {
            const channelData = {
                teamId: currentTeam._id,
                channelName: currentTeam.name
            }
            return rocketChatModels.channelModel.create(channelData);            
        }).catch(err => {
            logger.warn(err);
            throw new errors.BadRequest('Can not create RocketChat Channel');
        });
    }

    getOrCreateRocketChatChannel(teamId, params) {
        return rocketChatModels.channelModel.findOne({teamId})
        .then(channel => {
            if (!channel) {
                return this.createChannel(teamId, params).then(() => {
                    return rocketChatModels.channelModel.findOne({teamId})
                });
            } else return Promise.resolve(channel);
        })
        .then(channel => {
            return Promise.resolve({
                teamId: channel.teamId,
                channelName: channel.channelName
            });
        })
        .catch(err => {
            Promise.reject(new errors.BadRequest('error initializing the rocketchat channel', err));
        })
    }

    async addUsersToChannel(userIds, teamId) {
        const rcUserNames = await this.app.service('/rocketChat/user').find({userIds});
        const channel = await this.app.service('/rocketChat/channel').get(teamId);

        let invitationPromises = rcUserNames.map(userName => {
            let body = {
                roomName: channel.channelName,
                username: userName
            }
            return request(this.getOptions('/api/v1/groups.invite', body)).catch(err => { logger.warn(err) })
        })
        return Promise.all(invitationPromises);
    }

    async removeUsersFromChannel(userIds, teamId) {
        const rcUserNames = await this.app.service('/rocketChat/user').find({userIds});
        const channel = await this.app.service('/rocketChat/channel').get(teamId);

        let kickPromises = rcUserNames.map(userName => {
            let body = {
                roomName: channel.channelName,
                username: userName
            }
            return request(this.getOptions('/api/v1/groups.kick', body)).catch(err => { logger.warn(err) })
        })
        return Promise.all(kickPromises);
    }

    /**
     * removes the channel belonging to the team given by Id
     * @param {*} teamId Id of a team in the schulcloud
     */
    deleteChannel(teamId) {
        return rocketChatModels.channelModel.findOne({teamId})
        .then(async channel => {
            if (channel) {
                await request(this.getOptions('/api/v1/groups.delete', {roomName: channel.channelName}));
                await rocketChatModels.channelModel.deleteOne({_id: channel._id});
            }
            return Promise.resolve();
        })
        .catch(err => {
            logger.warn(err);
        })
    }

    /**
     * returns an existing or new rocketChat channel for a given Team ID
     * @param {*} teamId Id of a Team in the schulcloud
     * @param {*} params 
     */
    get(teamId, params) {
        return this.getOrCreateRocketChatChannel(teamId, params);
    }

    /**
     * React to event published by the Team service when users are added or
     * removed to a team.
     * @param {Object} context event context given by the Team service
     */
    _onTeamUsersChanged(context) {
        const team = ((context || {}).additionalInfosTeam || {}).team;
        let additionalUsers = (((context || {}).additionalInfosTeam || {}).changes || {}).add
        let removedUsers = (((context || {}).additionalInfosTeam || {}).changes || {}).remove

        additionalUsers = additionalUsers.map(user => {return user.userId})
        removedUsers = removedUsers.map(user => {return user.userId})

        if (additionalUsers.length > 0) this.addUsersToChannel(additionalUsers, team._id);
        if (removedUsers.length > 0) this.removeUsersFromChannel(removedUsers, team._id);
    }

    /**
     * react to a team being deleted
     * @param {*} context 
     */
    _onRemoved(context) {
        this.deleteChannel(context._id);
    }

    /**
     * Register methods of the service to listen to events of other services
     * @listens teams:after:usersChanged
     * @listens teams:removed
     */
    _registerEventListeners() {
        this.app.on('teams:after:usersChanged', this._onTeamUsersChanged.bind(this)); //use hook to get app
        this.app.service('teams').on('removed', this._onRemoved.bind(this));
    }

    
    setup(app, path) {
        this.app = app;
        this._registerEventListeners();
    }
}

module.exports = function () {
    const app = this;

    app.use('/rocketChat/channel', new RocketChatChannel());
    app.use('/rocketChat/user', new RocketChatUser());
    app.use('/rocketChat/login', new RocketChatLogin());

    const rocketChatUserService = app.service('/rocketChat/user');
    const rocketChatLoginService = app.service('/rocketChat/login');
    const rocketChatChannelService = app.service('/rocketChat/channel');

    rocketChatUserService.before(hooks.before);
    rocketChatUserService.after(hooks.after);

    rocketChatLoginService.before(hooks.before);
    rocketChatLoginService.after(hooks.after);

    rocketChatChannelService.before(hooks.before);
    rocketChatChannelService.after(hooks.after);
};