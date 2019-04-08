const winston = require('winston');
const config = require('config');
const mongoose = require('mongoose');


const request = require('request-promise-native');

// todo retrieve config from app context instead
const serviceUrls = config.get('services') || {};
const notification = config.get('notification') || {};

function getPreferences(deliveryOptions = {}) {
	const defaultOptions = { push: true, mail: true };
	return Object.assign({}, defaultOptions, deliveryOptions);
}

function createReceiver(userModel, deliveryOptions) {
	const name = `${userModel.firstName} ${userModel.lastName}`;
	const preferences = getPreferences(deliveryOptions);
	return {
		userId: mongoose.Types.ObjectId(userModel.id),
		name,
		mail: userModel.email,
		payload: {
			// todo required?
			name,
		},
		language: 'de', // todo add to user settings
		preferences,
	};
}

function createPushMessage(template, data, users, sender, languagePayloads, deliveryOptions) {
	return {
		template,
		payload: data,
		receivers: users.map(user => createReceiver(user, deliveryOptions)),
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

	if (!message.receivers || message.receivers.length === 0) {
		return Promise.reject('receivers missing!');
	}

	const options = {
		uri: `${serviceUrls.notification}/messages`,
		method: 'POST',
		body: Object.assign({}, message,
			{ serviceUrl: serviceUrls.notification },
			{ platform: notification.platform }),
		json: true,
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
	sendPush(template, data, users, sender) {
		// todo add language payloads
		const message = createPushMessage(template, data, users, sender, { language: 'de', payload: {} }, { mail: false });
		return sendMessage(message);
	},
	sendMessage(template, data, users, sender) {
		// todo add language payloads
		const message = createPushMessage(template, data, users, sender, { language: 'de', payload: {} });
		return sendMessage(message);
	},
	createReceiver,
};
