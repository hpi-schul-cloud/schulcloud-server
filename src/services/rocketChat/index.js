const request = require('request-promise-native');
const errors = require('feathers-errors');

const logger = require('../../logger');
const { UserModel, ChannelModel } = require('./model');
const hooks = require('./hooks');
const docs = require('./docs');
const { randomPass } = require('./randomPass');

const B = errors.BadRequest, F = errors.Forbidden, w = logger.warn, Resolve = Promise.resolve, Reject = Promise.reject, All = Promise.all;

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

/**
 * used RocketChat Endpoints 
 */
const RC = {
    'register': '/api/v1/users.register',
    'login': '/api/v1/login',
    'create': '/api/v1/groups.create'
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

const req = (uri, body, auth = false) => {
    return request(getReqOptions(uri, body, auth));
};

class RocketChatUser {
    constructor(options) {
        this.options = options || {};
        this.docs = docs;
    }

    newAccountData(user) {
        const pass = randomPass();
        const username = ([user.schoolId.name, user.firstName, user.lastName].join('.')).replace(/\s/g, '_');
        const email = user.email;
        const name = [user.firstName, user.lastName].join('.');
        const userId = user._id;
        return {
            rc: { email, pass, username, name },    //rocketChat endpoint
            sc: { userId, username, pass }          //schul-cloud model
        };
    }

    createRocketChatAccount(userId) {
        const internalParams = {
            query: { $populate: "schoolId" }
        };
        return this.app.service('users').get(userId, internalParams).then(user => {
            const { rc, sc } = this.newAccountData(user);

            return UserModel.create(sc).then((res) => {
                if (res.errors !== undefined)
                    throw new B('Can not insert into collection.', res.errors);

                return req(RC.register, rc).then(res => {
                    if (res.success === true && res.user !== undefined)
                        return res;
                    else
                        throw new B('False response data from rocketChat');
                });/*.catch(err=>{
                   throw err;
                }); */
            });
        }).catch(err => {
            w(err);
            throw new B('Can not create RocketChat Account');
        });
    }

    //todo secret for rocketChat
    create({ userId }, params) {
        if (userId === undefined)
            throw new B('Missing data value.');
        return this.createRocketChatAccount(userId);
    }

    getOrCreateRocketChatAccount(userId) {
        return UserModel.findOne({ userId })
            .then(login => {
                if (!login) {
                    return this.createRocketChatAccount(userId).then(res => {   //todo response from createRocketChatAccount should the user Object.
                        return UserModel.findOne({ userId });
                    });
                } else return Resolve(login);
            })
            .then(login => {
                return Resolve({ username: login.username, password: login.pass });
            }).catch(err => {
                w(err);
                return Reject(new B('could not initialize rocketchat user'));
            });
    }

    //todo: username nicht onfly generiert 
    get(userId, params) {
        return this.getOrCreateRocketChatAccount(userId)
            .then(login => {
                delete login.password; /*** important ***/
                return Resolve(login);
            }).catch(err => {
                w(err);
                throw new F('Can not create token.');
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
        return this.app.service('/rocketChat/user').getOrCreateRocketChatAccount(userId)
            .then(login => {
                return req(RC.login, login).then(res => {
                    const authToken = (res.data || {}).authToken;
                    if (res.status === "success" && authToken !== undefined)
                        return Resolve({ authToken });
                    else
                        return Reject(new B('False response data from rocketChat'));
                }).catch(err => {
                    return Reject(new F('Can not take token from rocketChat.', err));
                });
            }).catch(err => {
                w(err);
                throw new F('Can not create token.');
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

    createChannel(id) {
        return this.app.service('teams').get(id) //internalParams removed ..i think it is no need to populate
            .then(team => {
                const channelData = {
                    teamId: team._id,
                    channelName: team.name
                };
                return ChannelModel.create(channelData)
                    .then(({ name }) => {
                        return [name, team.userIds];
                    });
            }).then(([name, teamUsers]) => {
                let userNamePromises = teamUsers.map(user => {    //todo: in operation or ...to reduce the requests over find method
                    return this.app.service('rocketChat/user').get(user.userId);
                });
                return All(userNamePromises).then(users => {
                    const members = users.map(user => user.username);
                    return req(RC.create, { name, members }, true);
                });
            }).then((res) => {
                if (res.success === true) return res;
            }).catch(err => {
                w(err);
                throw new B('Can not create RocketChat Channel');
            });
    }

    getOrCreateRocketChatChannel(id) {
        return ChannelModel.findOne({ id })
            .then(channel => {
                if (!channel) {
                    return this.createChannel(id).then(() => {
                        return ChannelModel.findOne({ id });
                    });
                } else return Resolve(channel);
            })
            .then(({ teamId, channelName }) => {
                return Resolve({ teamId, channelName });
            })
            .catch(err => {
                Reject(new B('error initializing the rocketchat channel', err));
            });
    }

    get(id, params) {
        return this.getOrCreateRocketChatChannel(id);
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