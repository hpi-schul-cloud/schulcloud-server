const winston = require('winston');
const config = require('config');
const mongoose = require('mongoose');


const request = require('request-promise-native');

// todo retrieve config from app context instead
const serviceUrls = config.get('services') || {};
const notification = config.get('notification') || {};

function createReceiver(userModel) {
	const name = `${userModel.firstName} ${userModel.lastName}`;
	return {
		userId: mongoose.Types.ObjectId(userModel.id),
		name,
		mail: userModel.email,
		payload: {
			name,
		},
		language: 'de', // todo add to user settings
		preferences: {
			push: true, // todo add to user settings
			mail: true,
		},
	};
}

function createPushMessage(template, data, users, sender, languagePayloads) {
	return {
		template,
		payload: Object.assign({}, data, { tag: template }),
		receivers: users.map(user => createReceiver(user)),
		sender: sender ? createReceiver(sender) : null,
		languagePayloads,
	};
}

function sendMessage(message) {
	if (!process.env.NOTIFICATION_SERVICE_ENABLED) {
		const info = 'push message was not sent because notification service was disabled';
		return new Promise(() => {
			winston.debug(info, message);
		}).then(() => Promise.reject(info));
	}

	if (!message.receivers) {
		return Promise.reject('receivers missing!');
	}

	const options = {
		uri: `${serviceUrls.notification}/messages`,
		method: 'POST',
		body: Object.assign({}, message,
			{ serviceUrl: serviceUrls.notification },
			{ platform: notification.platform }),
		json: true,
		// timeout: REQUEST_TIMEOUT
	};

	return request(options)
		.then((response) => {
			winston.info(response);
			return response;
		})
		.catch((err) => {
			winston.error('failed to send push message', err);
			return null;
		});
}


module.exports = {
	send(template, data, users, sender) {
		// todo add language payloads
		const message = createPushMessage(template, data, users, sender, { language: 'de', payload: {} });
		return sendMessage(message);
	},
	createReceiver,
};
