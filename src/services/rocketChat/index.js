const request = require('request-promise-native');
const errors = require('feathers-errors');

const logger = require('../../logger');
const rocketChatModels = require('./model');
const hooks = require('./hooks');
const docs = require('./docs');
const { randomPass } = require('./randomPass');

const getEnv = (name) => {
    const env = process.env[name];
    if (env === undefined)
        throw new errors.NotImplemented('Please set process.env.' + name);
    return env;
};

const REQUEST_TIMEOUT = 4000; // in ms
const ROCKET_CHAT_URI = getEnv('ROCKET_CHAT');
const HEADERS = {
    'X-Auth-Token': getEnv('ROCKET_CHAT_ADMIN_TOKEN'),
    'X-User-ID': getEnv('ROCKET_CHAT_ADMIN_ID')
};

const getReqOptions = (shortUri, body, auth = false, method) => {
    let opt = {
        uri: ROCKET_CHAT_URI + shortUri,
        method: method || 'POST',
        body,
        json: true,
        timeout: REQUEST_TIMEOUT
    };

    if (auth === true)
        opt.headers = HEADERS;

    return opt;
};

class RocketChatUser {
    constructor(options) {
        this.options = options || {};
        this.docs = docs;
    }

    createRocketChatAccount(userId, params) {
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
                return request(getReqOptions('/api/v1/users.register', body)).then(res => {
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
    create({ userId }, params) {
        if (userId === undefined)
            throw new errors.BadRequest('Missing data value.');
        return this.createRocketChatAccount(userId, params);
    }

    getOrCreateRocketChatAccount(userId, params) {
        return rocketChatModels.userModel.findOne({ userId })
            .then(login => {
                if (!login) {
                    return this.createRocketChatAccount(userId, params)
                        .then(res => {
                            return rocketChatModels.userModel.findOne({ userId });
                        });
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

    get(userId, params) {
        return this.app.service('/rocketChat/user').getOrCreateRocketChatAccount(userId, params)
            .then(login => {
                return request(getReqOptions('/api/v1/login', login)).then(res => {
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

    createChannel(id, params) {
        //if (id === undefined)
        //     throw new errors.BadRequest('Missing data value.');

        let currentTeam;
        const internalParams = {
            query: { $populate: "schoolId" }
        };
        return this.app.service('teams').get(id, internalParams)
            .then(team => {
                currentTeam = team;
                const channelData = {
                    teamId: currentTeam._id,
                    channelName: currentTeam.name
                };
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
                    return request(getReqOptions('/api/v1/groups.create', body, true));
                });
            }).then((res) => {
                if (res.success === true) return res;
            }).catch(err => {
                logger.warn(err);
                throw new errors.BadRequest('Can not create RocketChat Channel');
            });
    }

    getOrCreateRocketChatChannel(id, params) {
        return rocketChatModels.channelModel.findOne({ id })
            .then(channel => {
                if (!channel) {
                    return this.createChannel(id, params).then(() => {
                        return rocketChatModels.channelModel.findOne({ id });
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
            });
    }

    get(id, params) {
        return this.getOrCreateRocketChatChannel(id, params);
    }

    setup(app, path) {
        this.app = app;
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