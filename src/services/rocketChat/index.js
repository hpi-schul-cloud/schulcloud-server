const request = require('request-promise-native');
//const service = require('feathers-mongoose');
const errors = require('feathers-errors');
const logger = require('winston');

const rocketChatModels = require('./model'); //toDo: deconstruct
const {rocketChatUserHooks, rocketChatLoginHooks, rocketChatLogoutHooks, rocketChatChannelHooks} = require('./hooks');
const docs = require('./docs');
const { randomPass, randomSuffix } = require('./randomPass');


const REQUEST_TIMEOUT = 4000; // in ms
const ROCKET_CHAT_URI = process.env.ROCKET_CHAT;

if (ROCKET_CHAT_URI === undefined)
    throw new errors.NotImplemented('Please set process.env.ROCKET_CHAT.');

/**
 * create a valid options object to call a rocketChat request.
 * @param {String} shortUri Uri of the Rocket.Chat endpoint. Example: '/api/v1/users.register'
 * @param {Object} body Body of the request, as required by the rocket.chat API
 * @param {Boolean} asAdmin If true, request will be sent with admin privileges, and auth field will be ignored.
 * @param {Object} auth optional, object of the form {authToken, userId}.
 * @param {String} method the REST method to be called. Example: 'POST'.
 */
const getRequestOptions = function(shortUri, body, asAdmin, auth, method) {
    let headers = undefined
    if (asAdmin) {
        headers = {
            'X-Auth-Token': process.env.ROCKET_CHAT_ADMIN_TOKEN,
            'X-User-ID': process.env.ROCKET_CHAT_ADMIN_ID
        }
    } else if (auth) {
        headers = {
            'X-Auth-Token': auth.authToken,
            'X-User-ID': auth.userId
        }
    }
    return {
        uri: ROCKET_CHAT_URI + shortUri,
        method: method || 'POST',
        body,
        headers: headers,
        json: true,
        timeout: REQUEST_TIMEOUT
    }
};

class RocketChatUser {
    constructor(options) {
        this.options = options || {};
        this.docs = docs;
    }

    generateUserName(user) {
        //toDo: implementation with bound execution time.
        let userName = user.firstName + "." + user.lastName + "." + randomSuffix();
        //toDo: check availibility in rocketChat as well.
        return rocketChatModels.userModel.findOne({username: userName})
        .then(result => {
            if (!result) {
                return Promise.resolve(userName)
            } else return this.generateUserName(user)
        })
    }

    /**
     * creates an account, should be called by getOrCreateRocketChatAccount
     * @param {object} data
     */
    createRocketChatAccount(userId) {
        if (userId === undefined)
            throw new errors.BadRequest('Missing data value.');

        const internalParams = {
            query: { $populate: "schoolId" }
        };
        return this.app.service('users').get(userId, internalParams).then(async user => {
            const email = user.email;
            const pass = randomPass();
            const username = await this.generateUserName(user);
            const name = [user.firstName, user.lastName].join(' ');

            const body = { email, pass, username, name };
                return request(getRequestOptions('/api/v1/users.register', body)).then(res => {
                    if (res.success === true && res.user !== undefined)
                        return res;
                    else
                        throw new errors.BadRequest('False response data from rocketChat');
                }).then(result => {
                    let rcId = result.user._id
                    return rocketChatModels.userModel.create({ userId, pass, username, rcId })
                }).catch(err => {
                    throw new errors.BadRequest('Can not write user informations to rocketChat.', err);
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
            return Promise.resolve({ username: login.username, password: login.pass, authToken: login.authToken, rcId: login.rcId });
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
                let res = await request(getRequestOptions('/api/v1/users.delete', {username: user.username}, true));
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
    /**
     * Logs in a user given by his Id
     * @param {*} userId Id of a user in the schulcloud
     * @param {*} params 
     */
    get(userId, params) {
        //rewrite as async
        if (userId != params.account.userId) {
            return Promise.reject(new errors.Forbidden("you may only log into your own rocketChat account"))
        }
        return this.app.service('/rocketChat/user').getOrCreateRocketChatAccount(userId, params)
        .then(rcAccount => {
            //toDo: dont log in twice
            const login = {
                user: rcAccount.username,
                password: rcAccount.password
            }
            return request(getRequestOptions('/api/v1/login', login)).then(async res => {
                const authToken = (res.data || {}).authToken;
                if (res.status === "success" && authToken !== undefined) {
                    await rocketChatModels.userModel.update({username: rcAccount.username}, {authToken})
                    return Promise.resolve({ authToken });
                } else
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
        try{
            let rcUser = await this.app.service('/rocketChat/user').getOrCreateRocketChatAccount(userId, params);
            if (rcUser.authToken && rcUser.authToken != "") {
                const headers = {
                    authToken: rcUser.authToken,
                    userId: rcUser.rcId
                }
                await rocketChatModels.userModel.update({username: rcUser.username}, {authToken: ""});
                await request(getRequestOptions('/api/v1/logout', {}, false, headers))
                return ("success")
            }
        } catch(error) {
            throw errors.BadRequest("could not log out user")
        }
    }

    /**
     * react to a user logging out
     * @param {*} context 
     */
    _onAuthenticationRemoved(context) {
        this.get(context.userId);
    }

    /**
     * Register methods of the service to listen to events of other services
     * @listens authentication:removed
     */
    _registerEventListeners() {
        this.app.service('authentication').on('removed', this._onAuthenticationRemoved.bind(this));
    }
    
    setup(app, path) {
        this.app = app;     
        this._registerEventListeners();
    }
}

class RocketChatChannel {
    constructor(options) {
        this.options = options || {};
        this.docs = docs;
    }

    generateChannelName(team) {
        //toDo: implementation with bound execution time.
        let channelName = team.name.replace(' ', '-') + "." + randomSuffix();
        //toDo: check availibility in rocketChat as well.
        return rocketChatModels.channelModel.findOne({channelName: channelName})
        .then(result => {
            if (!result) {
                return Promise.resolve(channelName)
            } else return this.generateChannelName(team)
        })
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

            return Promise.all(userNamePromises).then(async users => {
                users = users.map(user => { return user.username; });
                let channelName = await this.generateChannelName(currentTeam);
                const body = { 
                    name: channelName,
                    members: users
                };
                return request(getRequestOptions('/api/v1/groups.create', body, true))
                .then(res => {
                    if (res.success === true) return res;
                    else return Promise.reject("bad answer on group creation")
                })
            })
        }).then(result => {
            const channelData = {
                teamId: currentTeam._id,
                channelName: result.group.name
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
            return request(getRequestOptions('/api/v1/groups.invite', body, true)).catch(err => { logger.warn(err) })
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
            return request(getRequestOptions('/api/v1/groups.kick', body, true)).catch(err => { logger.warn(err) })
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
                await request(getRequestOptions('/api/v1/groups.delete', {roomName: channel.channelName}, true));
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
    app.use('/rocketChat/logout', new RocketChatLogout());

    const rocketChatUserService = app.service('/rocketChat/user');
    const rocketChatLoginService = app.service('/rocketChat/login');
    const rocketChatLogoutService = app.service('rocketChat/logout')
    const rocketChatChannelService = app.service('/rocketChat/channel');

    rocketChatUserService.before(rocketChatUserHooks.before);
    rocketChatUserService.after(rocketChatUserHooks.after);

    rocketChatLoginService.before(rocketChatLoginHooks.before);
    rocketChatLoginService.after(rocketChatLoginHooks.after);

    rocketChatLogoutService.before(rocketChatLogoutHooks.before);
    rocketChatLogoutService.after(rocketChatLogoutHooks.after);

    rocketChatChannelService.before(rocketChatChannelHooks.before);
    rocketChatChannelService.after(rocketChatChannelHooks.after);
};