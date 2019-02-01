'use strict';

const request = require('request-promise-native');
const hooks = require('./hooks/index');
const { userModel } = require('../user/model');

const REQUEST_TIMEOUT = 8000; // in ms

/**
 * maps jsonapi properties of a response to fit anything but jsonapi
 * @param response
 */
const mapResponseProps = (response) => {
	if(response.data && response.data.type){
		response.type = response.data.type;
	}
	if(response.data && response.data.id){
		response.id = response.data.id;
	}
	return response;
};

const toQueryString = (paramsObject) => {
	return Object
		.keys(paramsObject)
		.map(key => `${encodeURIComponent(key)}=${encodeURIComponent(paramsObject[key])}`)
		.join('&');
};

const resolveReceivers = (userIds) => {
	return Promise.all(userIds.map(userId =>{
		let receiver = {
			_id: userId
		};
		return userModel.findById(userId).then(user=>{
			if(user){
				receiver.payload = {
					name: `${user.firstName} ${user.lastName}`
				};
				receiver.mail = user.email;
				receiver.language = 'de';
				return Promise.resolve(receiver);
			} 
			return Promise.reject('user not found');
		});
	}));
};

class PushService {
	constructor(options) {
		this.options = options || {};
	}

	async create(data, params) {

		const serviceUrls = this.app.get('services') || {};
		const notification = this.app.get('notification') || {};

		const userId = (params.account ||{}).userId || params.payload.userId;

		data.receivers = await resolveReceivers(data.receivers);

		const options = {
			uri: serviceUrls.notification + '/push/',
			method: 'POST',
			headers: {
				'token': userId
			},
			body: Object.assign(data,
				{ serviceUrl: serviceUrls.notification },
				{ platform: notification.platform }
			),
			json: true,
			timeout: REQUEST_TIMEOUT
		};

		return request(options).then(response => {
			return response;
		});
	}

	get(id, params) {

		const serviceUrls = this.app.get('services') || {};

		const userId = (params.account ||{}).userId || params.payload.userId;
		const options = {
			uri: serviceUrls.notification + '/push/' + id +'?token=' + userId,
			headers: {
				'token': userId
			},
			json: true,
			timeout: REQUEST_TIMEOUT
		};

		return request(options).then(message => {
			return message;
		});
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

		const serviceUrls = this.app.get('services') || {};

		const userId = (params.account ||{}).userId || params.payload.userId;
		const options = {
			uri: serviceUrls.notification + '/messages/',
			method: 'POST',
			headers: {
				'token': userId
			},
			body: Object.assign(data, {serviceUrl: serviceUrls.notification}),
			json: true,
			timeout: REQUEST_TIMEOUT
		};

		return request(options).then(response => {
			return response;
		});
	}

	get(id, params) {

		const serviceUrls = this.app.get('services') || {};

		const userId = (params.account ||{}).userId || params.payload.userId;
		const options = {
			uri: serviceUrls.notification + '/messages/' + id +'?token=' + userId,
			headers: {
				'token': userId
			},
			json: true,
			timeout: REQUEST_TIMEOUT
		};

		return request(options).then(message => {
			return message;
		});
	}

	setup(app, path) {
		this.app = app;
	}
}

class DeviceService {
	constructor(options) {
		this.options = options || {};
	}

	find(params) {
		const serviceUrls = this.app.get('services') || {};
		const notification = this.app.get('notification') || {};

		const userId = (params.account ||{}).userId || params.payload.userId;
		const options = {
			uri: serviceUrls.notification + '/devices/' + notification.platform +'/' + userId,
			headers: {
				'token': userId
			},
			json: true,
			timeout: REQUEST_TIMEOUT
		};

		return request(options).then(devices => {
			return devices;
		});
	}

	create(data, params) {
		const serviceUrls = this.app.get('services') || {};

		const userId = (params.account ||{}).userId || params.payload.userId;
		const notification = this.app.get('notification') || {};

		const options = {
			uri: serviceUrls.notification + '/devices/',
			method: 'POST',
			headers: {
				'token': userId
			},
			body: Object.assign({}, data, { platform: notification.platform }),
			json: true,
			timeout: REQUEST_TIMEOUT
		};

		return request(options).then(response => {
			return mapResponseProps(response);
		});
	}

	remove(id, params) {
		const serviceUrls = this.app.get('services') || {};
		const notification = this.app.get('notification') || {};

		const userId = (params.account ||{}).userId || params.payload.userId;
		const options = {
			uri: serviceUrls.notification + '/devices/' + notification.platformId + '/' + userId + '/' + id,
			method: 'DELETE',
			json: true,
			timeout: REQUEST_TIMEOUT
		};

		return request(options).then(message => {
			return message;
		});
	}

	setup(app, path) {
		this.app = app;
	}
}

class CallbackService {
	constructor(options) {
		this.options = options || {};
	}

	create(data, params) {

		const serviceUrls = this.app.get('services') || {};

		const userId = (params.account ||{}).userId || params.payload.userId;
		const options = {
			uri: serviceUrls.notification + '/callback/',
			method: 'POST',
			headers: {
				'token': userId
			},
			body: data,
			json: true,
			timeout: REQUEST_TIMEOUT
		};

		return request(options).then(response => {
			return response;
		});
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

		const userId = (params.account ||{}).userId || params.payload.userId;
		const options = {
			uri: serviceUrls.notification + '/notifications/' + id,
			headers: {
				'token': userId
			},
			json: true,
			timeout: REQUEST_TIMEOUT
		};

		return request(options).then(message => {
			return message;
		});
	}

	find(params) {

		const serviceUrls = this.app.get('services') || {};

		const userId = (params.account ||{}).userId || params.payload.userId;

		const options = {
			uri: serviceUrls.notification + '/notifications/' + '?user=' + userId + '&' + toQueryString(params.query),
			headers: {
				'token': userId
			},
			json: true,
			timeout: REQUEST_TIMEOUT
		}; 

		return request(options).then(message => {
			return message;
		});
	}

	setup(app, path) {
		this.app = app;
	}
}

module.exports = function () {
	const app = this;

	// Initialize our service with any options it requires
	app.use('/notification/push', new PushService());
	app.use('/notification/messages', new MessageService());
	app.use('/notification/devices', new DeviceService());
	app.use('/notification/callback', new CallbackService());
	app.use('/notification', new NotificationService());

	// Get our initialize service to that we can bind hooks
	const pushService = app.service('/notification/push');
	const messageService = app.service('/notification/messages');
	const deviceService = app.service('/notification/devices');
	const callbackService = app.service('/notification/callback');
	const notificationService = app.service('/notification');

	// Set up our before hooks
	pushService.before(hooks.before);
	messageService.before(hooks.before);
	deviceService.before(hooks.before);
	callbackService.before(hooks.before);
	notificationService.before(hooks.before);

	// Set up our after hooks
	pushService.after(hooks.after);
	messageService.after(hooks.after);
	deviceService.after(hooks.after);
	callbackService.after(hooks.after);
	notificationService.after(hooks.after);
};
