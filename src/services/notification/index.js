

const request = require('request-promise-native');
const { hooks, callbackHooks } = require('./hooks/index');
const UserModel = require('../user/model');

const { sendPush, sendMessage } = require('../../events/notificationSender');

const DEFAULT_REDIRECT = 'https://schul-cloud.org';

/**
 * maps jsonapi properties of a response to fit anything but jsonapi
 * @param response
 */
const mapResponseProps = (response) => {
	if (response.data && response.data.type) {
		response.type = response.data.type;
	}
	if (response.data && response.data.id) {
		response.id = response.data.id;
	}
	return response;
};

const toQueryString = paramsObject => Object
	.keys(paramsObject)
	.map(key => `${encodeURIComponent(key)}=${encodeURIComponent(paramsObject[key])}`)
	.join('&');

class PushService {
	constructor(options) {
		this.options = options || {};
	}

	create(data, params) {
		return sendPush(data.template, data.payload, data.users);
	}

	get(id, params) {
		// FIXME remove, use MessageService.get instead
		const serviceUrls = this.app.get('services') || {};

		const userId = (params.account || {}).userId || params.payload.userId;
		const options = {
			uri: `${serviceUrls.notification}/push/${id}?token=${userId}`,
			headers: {
				token: userId,
			},
			json: true,
		};

		return request(options).then(message => message);
	}

	setup(app, path) {
		this.app = app;
	}
}

class MessageService {
	constructor(options) {
		this.options = options || {};
	}

	create(data, params) {
		return sendMessage(data.template, data.payload, data.users);
	}

	get(id, params) {
		const userId = (params.account || {}).userId || params.payload.userId;
		const options = {
			uri: `${this.serviceUrls.notification}/messages/${id}?token=${userId}`,
			headers: {
				token: userId,
			},
			json: true,
		};

		return request(options).then(message => message);
	}

	remove(id, params) {
		const userId = (params.account || {}).userId || params.payload.userId;
		const options = {
			uri: `${this.serviceUrls.notification}/messages/${id}/remove/${userId}`,
			method: 'POST',
			json: true,
		};
		return request(options).then(response => response);
	}

	setup(app, path) {
		this.app = app;
		this.serviceUrls = this.app.get('services') || {};
	}
}

class DeviceService {
	constructor(options) {
		this.options = options || {};
	}

	find(params) {
		const serviceUrls = this.app.get('services') || {};
		const notification = this.app.get('notification') || {};

		const userId = (params.account || {}).userId || params.payload.userId;
		const options = {
			uri: `${serviceUrls.notification}/devices/${notification.platform}/${userId}`,
			headers: {
				token: userId,
			},
			json: true,
		};

		return request(options).then(devices => devices);
	}

	create(data) {
		const serviceUrls = this.app.get('services') || {};

		const notification = this.app.get('notification') || {};

		const options = {
			uri: `${serviceUrls.notification}/devices/`,
			method: 'POST',
			body: Object.assign({}, data, { platform: notification.platform }),
			json: true,
		};

		return request(options).then(response => mapResponseProps(response));
	}

	remove(id, params) {
		const serviceUrls = this.app.get('services') || {};
		const notification = this.app.get('notification') || {};

		const userId = (params.account || {}).userId || params.payload.userId;
		const options = {
			uri: `${serviceUrls.notification}/devices/${notification.platform}/${userId}/${id}`,
			method: 'DELETE',
			json: true,
		};

		return request(options).then(message => message);
	}

	setup(app, path) {
		this.app = app;
	}
}

class CallbackService {
	constructor(options) {
		this.options = options || {};
	}

	get(id, params) {
		const serviceUrls = this.app.get('services') || {};
		const data = {
			receiverId: params.query.receiverId,
			redirect: params.query.redirect || null,
		};
		const options = {
			uri: `${serviceUrls.notification}/messages/${id}/seen`,
			method: 'POST',
			body: data,
			json: true,
		};

		return request(options).then(response => response);
	}

	// todo remove auth
	create(data, params) {
		const serviceUrls = this.app.get('services') || {};

		const options = {
			uri: `${serviceUrls.notification}/messages/${data.messageId}/seen`,
			method: 'POST',
			body: data,
			json: true,
		};

		return request(options).then(response => response);
	}

	setup(app, path) {
		this.app = app;
	}
}

class NotificationService {
	constructor(options) {
		this.options = options || {};
	}

	get(id, params) {
		const serviceUrls = this.app.get('services') || {};

		const userId = (params.account || {}).userId || params.payload.userId;
		const options = {
			uri: `${serviceUrls.notification}/notifications/${id}`,
			headers: {
				token: userId,
			},
			json: true,
		};

		return request(options).then(message => message);
	}

	find(params) {
		const serviceUrls = this.app.get('services') || {};

		const userId = (params.account || {}).userId || params.payload.userId;

		const options = {
			uri: `${serviceUrls.notification}/notifications/`
				+ `?user=${userId}&${toQueryString(params.query)}`,
			headers: {
				token: userId,
			},
			json: true,
		};

		return request(options).then(message => message);
	}

	setup(app, path) {
		this.app = app;
	}
}

class ConfigurationService {
	constructor(options) {
		this.options = options || {};
		this.constants = {
			NOTIFICATION_OPTIONS: 'notificationOptions',
			FIREBASE_OPTIONS: 'firebaseOptions',
		};
	}

	get(id, params) {
		let options = {};
		if (id === this.constants.FIREBASE_OPTIONS) {
			options = this.app.get('notification')[id] || {};
			return Promise.resolve(options);
		}
		if (id === this.constants.NOTIFICATION_OPTIONS) {
			const userId = (params.account || {}).userId || params.payload.userId;
			return UserModel.userModel.findById(userId).exec().then((user) => {
				if (user === null) return Promise.reject();
				options = user.preferences[id] || {};
				return Promise.resolve(options);
			});
		}
		Promise.reject();
	}

	patch(id, data, params) {
		const userId = (params.account || {}).userId || params.payload.userId;
		if (id === this.constants.NOTIFICATION_OPTIONS) {
			const user = { preferences: {} };
			user.preferences[id] = data;
			return UserModel.userModel.findByIdAndUpdate(userId, { $set: user })
				.then(() => data);
		}
		return Promise.reject();
	}

	setup(app, path) {
		this.app = app;
	}
}

function redirect(req, res, next) {
	if (req.query && req.query.redirect) {
		return res.redirect(301, req.query.redirect);
	}
}

module.exports = function () {
	const app = this;

	// Initialize our service with any options it requires
	app.use('/notification/push', new PushService());
	app.use('/notification/messages', new MessageService());
	app.use('/notification/devices', new DeviceService());
	app.use('/notification/configuration', new ConfigurationService());
	app.use('/notification/callback', new CallbackService(), redirect);
	app.use('/notification', new NotificationService());

	// Get our initialize service to that we can bind hooks
	const pushService = app.service('/notification/push');
	const messageService = app.service('/notification/messages');
	const deviceService = app.service('/notification/devices');
	const configurationService = app.service('/notification/configuration');
	const callbackService = app.service('/notification/callback');
	const notificationService = app.service('/notification');

	// Set up our before hooks
	pushService.before(hooks.before);
	messageService.before(hooks.before);
	deviceService.before(hooks.before);
	configurationService.before(hooks.before);
	callbackService.before(callbackHooks.before);
	notificationService.before(hooks.before);

	// Set up our after hooks
	pushService.after(hooks.after);
	messageService.after(hooks.after);
	deviceService.after(hooks.after);
	configurationService.after(hooks.after);
	callbackService.after(hooks.after);
	notificationService.after(hooks.after);
};
