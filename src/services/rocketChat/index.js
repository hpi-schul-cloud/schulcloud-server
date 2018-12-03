const request = require('request-promise-native');
//const service = require('feathers-mongoose');
const errors = require('feathers-errors');
const logger = require('winston');

const RocketChatModel = require('./model');
const hooks = require('./hooks');
const docs = require('./docs');
const { randomPass } = require('./randomPass');


const REQUEST_TIMEOUT = 4000; // in ms
const ROCKET_CHAT_URI = process.env.ROCKET_CHAT;

if (ROCKET_CHAT_URI === undefined)
    throw new errors.NotImplemented('Please set process.env.ROCKET_CHAT.');

class RocketChat {
    constructor(options) {
        this.options = options || {};
        this.docs = docs;
    }

    getOptions(shortUri, body, method) {
        return {
            uri: ROCKET_CHAT_URI + shortUri,
            method: method || 'POST',
            //  headers: {
            //     'Authorization': process.env.ROCKET_CHAT_SECRET
            // },
            body,
            json: true,
            timeout: REQUEST_TIMEOUT
        };
    }

    //todo secret for rocketChat
    create(data, params) {
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

            return RocketChatModel.create({ userId, pass, username }).then((res) => {
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

    //todo: username nicht onfly generiert 
    get(userId, params) {

        return new Promise((resolve, reject) => {
            RocketChatModel.findOne({ userId }, { 'username': 1, 'pass': 1, '_id': 0 }, (err, login) => {
                if (err)
                    reject(new errors.BadRequest('Can not found user.', err));

                const body = { username: login.username, password: login.pass };
                request(this.getOptions('/api/v1/login', body)).then(res => {
                    const authToken = (res.data || {}).authToken;
                    if (res.status === "success" && authToken !== undefined)
                        resolve({ authToken });
                    else
                        reject(new errors.BadRequest('False response data from rocketChat'));
                }).catch(err => {
                    reject(new errors.Forbidden('Can not take token from rocketChat.', err));
                });
            });
        }).catch(err => {
            logger.warn(err);
            throw new errors.Forbidden('Can not create token.');
        });
    }

    update(userId, data, params) {     //todo maybe patch and test if data is used?
        return new Promise((resolve, reject) => {
            RocketChatModel.findOne({ userId }, (err, data) => {
                if (err !== null)
                    reject(err);

                if (data === null)    //do not exist       
                    resolve(this.create({ userId }));
                else if (typeof data === 'object')
                    resolve({ message: 'exist' });

            });
        }).catch(err => {
            logger.warn(err);
            throw new errors.BadRequest('Can not execute this task.');
        });
    }

    patch(userId, data, params) {
        return new Promise((resolve, reject) => {
            if (data.username === undefined)
                throw new errors.BadRequest('You can only patch username.');

            const update = { $set: { username: data.username, pass: randomPass() } };
            RocketChat.findOneAndUpdate({ userId }, update, (err, data) => {
                if (err !== null)
                    reject(err);
                if (data === null)
                    reject({ message: 'user not found' });

                //todo: update rocketChat!
                resolve(data);
            });
        }).catch(err => {
            logger.warn(err);
            throw new errors.BadRequest('Can not patch this user');
        });
    }



    setup(app, path) {
        this.app = app;
    }
}

module.exports = function () {
    const app = this;
	/*const options = {
		Model: model,
		paginate: {
			default: 1,
			max: 1
		},
		lean: true
    }; */

    app.use('/rocketChat', new RocketChat());

    const rocketChatService = app.service('/rocketChat');

    rocketChatService.before(hooks.before);
    rocketChatService.after(hooks.after);
};