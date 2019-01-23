const winston = require('winston');
const config = require('config');
const REQUEST_TIMEOUT = 8000;
const request = require('request-promise-native');

// todo retrieve config from app context instead
const serviceUrls = config.get('services') || {};
const notification = config.get('notification') || {};

function createPushMessage(template, data, users, sender, languagePayloads) {
    return {
        template,
        payload: Object.assign({}, data, { tag: template }),
        receivers: users.map(user => createReceiver(user)),
        sender: createReceiver(sender),
        languagePayloads
    }
}

function createReceiver(userModel) {
    const name = userModel.firstName + ' ' + userModel.lastName;
    return {
        id: userModel.id,
        name,
        mail: userModel.email,
        payload: {
            name
        },
        language: 'de', // todo add to user settings
        preferences: {
            push: true, // todo add to user settings
            mail: true
        }
    };
}

function sendMessage(message) {

    if (!process.env.NOTIFICATION_SERVICE_ENABLED) {
        const info = 'push message was not sent because notification service was disabled';
        return new Promise((resolve, reject) => {
            winston.debug(info, message);
            return
        }).then(_ => Promise.reject(info));
    }

    if (!message.receivers) {
        return Promise.reject('receivers missing!');
    }

    const options = {
        uri: serviceUrls.notification + '/messages',
        method: 'POST',
        body: Object.assign({}, message,
            { serviceUrl: serviceUrls.notification },
            { platform: notification.platform }
        ),
        json: true,
        //timeout: REQUEST_TIMEOUT
    };

    return request(options).then(response => {
        return response;
    }).catch(err => {
        winston.error('failed to send push message', err);
        return null;
    });
}


module.exports = {
    send: function (template, data, users, sender) {
        // todo add language payloads 
        const message = createPushMessage(template, data, users, sender, { 'language': 'de', 'payload': {} });
        return sendMessage(message);
    }
}
