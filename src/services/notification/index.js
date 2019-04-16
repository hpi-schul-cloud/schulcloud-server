

const request = require('request-promise-native');
const hooks = require('./hooks/index');

const REQUEST_TIMEOUT = 8000; // in ms

/**
 * maps jsonapi properties of a response to fit anything but jsonapi
 * @param response
 */
const mapResponseProps = (response) => {
	response.type = response.data.type;
	response.id = response.data.id;
	return response;
};

const toQueryString = paramsObject => Object
	.keys(paramsObject)
	.map(key => `${encodeURIComponent(key)}=${encodeURIComponent(paramsObject[key])}`)
	.join('&');

class MessageService {
	constructor(options) {
		this.options = options || {};
	}

	create(data, params) {
		const serviceUrls = this.app.get('services') || {};

		const userId = (params.account || {}).userId || params.payload.userId;
		const options = {
			uri: `${serviceUrls.notification}/messages/`,
			method: 'POST',
			headers: {
				token: userId,
			},
			body: Object.assign(data, { serviceUrl: serviceUrls.notification }),
			json: true,
			timeout: REQUEST_TIMEOUT,
		};

		return request(options).then(response => response);
	}

	get(id, params) {
		const serviceUrls = this.app.get('services') || {};

		const userId = (params.account || {}).userId || params.payload.userId;
		const options = {
			uri: `${serviceUrls.notification}/messages/${id}?token=${userId}`,
			headers: {
				token: userId,
			},
			json: true,
			timeout: REQUEST_TIMEOUT,
		};

		return request(options).then(message => message);
	}

	setup(app) {
		this.app = app;
	}
}

class DeviceService {
	constructor(options) {
		this.options = options || {};
	}

	find(params) {
		const serviceUrls = this.app.get('services') || {};

		const userId = (params.account || {}).userId || params.payload.userId;
		const options = {
			uri: `${serviceUrls.notification}/devices/${userId}?token=${userId}`,
			headers: {
				token: userId,
			},
			json: true,
			timeout: REQUEST_TIMEOUT,
		};

		return request(options).then(devices => devices);
	}

	create(data, params) {
		const serviceUrls = this.app.get('services') || {};

		const userId = (params.account || {}).userId || params.payload.userId;

		const options = {
			uri: `${serviceUrls.notification}/devices/`,
			method: 'POST',
			headers: {
				token: userId,
			},
			body: data,
			json: true,
			timeout: REQUEST_TIMEOUT,
		};

		return request(options).then(response => mapResponseProps(response));
	}

	remove(id, params) {
		const serviceUrls = this.app.get('services') || {};

		const userId = (params.account || {}).userId || params.payload.userId;
		const options = {
			uri: `${serviceUrls.notification}/devices/${id}?token=${userId}`,
			method: 'DELETE',
			json: true,
			timeout: REQUEST_TIMEOUT,
		};

		return request(options).then(message => message);
	}

	setup(app) {
		this.app = app;
	}
}

class CallbackService {
	constructor(options) {
		this.options = options || {};
	}

	create(data, params) {
		const serviceUrls = this.app.get('services') || {};

		const userId = (params.account || {}).userId || params.payload.userId;
		const options = {
			uri: `${serviceUrls.notification}/callback/`,
			method: 'POST',
			headers: {
				token: userId,
			},
			body: data,
			json: true,
			timeout: REQUEST_TIMEOUT,
		};

		return request(options).then(response => response);
	}

	setup(app) {
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
			timeout: REQUEST_TIMEOUT,
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
			timeout: REQUEST_TIMEOUT,
		};

		return request(options).then(message => message);
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = () => {
	const app = this;

	// Initialize our service with any options it requires
	app.use('/notification/messages', new MessageService());
	app.use('/notification/devices', new DeviceService());
	app.use('/notification/callback', new CallbackService());
	app.use('/notification', new NotificationService());

	// Get our initialize service to that we can bind hooks
	const messageService = app.service('/notification/messages');
	const deviceService = app.service('/notification/devices');
	const callbackService = app.service('/notification/callback');
	const notificationService = app.service('/notification');

	// Set up our before hooks
	messageService.before(hooks.before);
	deviceService.before(hooks.before);
	callbackService.before(hooks.before);
	notificationService.before(hooks.before);

	// Set up our after hooks
	messageService.after(hooks.after);
	deviceService.after(hooks.after);
	callbackService.after(hooks.after);
	notificationService.after(hooks.after);
};
