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

    createRocketChatAccount(data, params) {
        const userId = data.userId;
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

    //todo secret for rocketChat
    create(data, params) {
        return this.createRocketChatAccount(data, params);
    }

    getOrCreateRocketChatAccount(userId, params) {
        return rocketChatModels.userModel.findOne({ userId })
        .then(login => {
            if (!login) {
                return this.createRocketChatAccount({userId}, params)
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

    //todo: username nicht onfly generiert 
    get(userId, params) {
        return this.getOrCreateRocketChatAccount(userId, params)
        .then(login => {
            delete login.password;
            return Promise.resolve(login);
        }).catch(err => {
            logger.warn(err);
            throw new errors.Forbidden('Can not create token.');
        });
    }

    setup(app, path) {
        this.app = app;
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
                'X-Auth-Token': '2_5rp4YRBnJ0q9asWFY-lEqeBalK94DoOwrgpsxYvhd',
                'X-User-ID': "6NHge4r7Rtb2pwofe"
                //'X-Auth-Token': process.env.ROCKET_CHAT_ADMIN_TOKEN,
                //'X-User-ID': process.env.ROCKET_CHAT_ADMIN_ID
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
            const channelData = {
                teamId: currentTeam._id,
                channelName: currentTeam.name
            }
            return rocketChatModels.channelModel.create(channelData); 
        }).then(result => {
            let userNamePromises = currentTeam.userIds.map(user => {
                return this.app.service('rocketChat/user').get(user.userId);
            });
            return Promise.all(userNamePromises).then(users => {
                users = users.map(user => { return user.username; });
                const body = { 
                    name: result.channelName,
                    members: users
                };
                return request(this.getOptions('/api/v1/groups.create', body))
            })            
        }).then((res) => {
            if (res.success === true) return res;
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

    addUsersToChannel(userIds, teamId) {
        userNamePromises = userIds.map(userId => { //toDo: refactor to a function that returns multiple
            this.app.service('rocketChat/user').get(user.userId);
        })
        channelPromise = this.app.service('rocketChat/channel').get(teamId);

        return Promise.resolve();
    }

    removeUsersFromChannel(userIds, teamId) {
        return Promise.resolve
    }

    get(Id, params) {
        return this.getOrCreateRocketChatChannel(Id, params);
    }

    _onTeamUsersChanged(context) {
        const team = ((context || {}).additionalInfosTeam || {}).team;
        additionalUsers = (((context || {}).additionalInfosTeam || {}).changes || {}).add
        removedUsers = (((context || {}).additionalInfosTeam || {}).changes || {}).add

        additionalUsers = additionalUsers.map(user => {return user.userId})
        removedUsers = additionalUsers.map(user => {return user.userId})

        if (changes) {
            this.addUsersToChannel(additionalUsers, team._id);
            this.removeUsersFromChannel(removedUsers, team._id);
        }
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

    app.on('teams:after:usersChanged', rocketChatChannelService._onTeamUsersChanged)
};