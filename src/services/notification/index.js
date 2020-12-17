// eslint-disable-next-line max-classes-per-file
const request = require('request-promise-native');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');
const queryString = require('qs');

const { Configuration } = require('@hpi-schul-cloud/commons');
const hooks = require('./hooks/index');

/**
 * maps jsonapi properties of a response to fit anything but jsonapi
 * @param response
 */
const mapResponseProps = (response) => {
	response.type = response.data.type;
	response.id = response.data.id;
	return response;
};

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
			timeout: Configuration.get('REQUEST_TIMEOUT'),
		};

		return request(options).then((response) => response);
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
			timeout: Configuration.get('REQUEST_TIMEOUT'),
		};

		return request(options).then((message) => message);
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
			timeout: Configuration.get('REQUEST_TIMEOUT'),
		};

		return request(options).then((devices) => devices);
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
			timeout: Configuration.get('REQUEST_TIMEOUT'),
		};

		return request(options).then((response) => mapResponseProps(response));
	}

	remove(id, params) {
		const serviceUrls = this.app.get('services') || {};

		const userId = (params.account || {}).userId || params.payload.userId;
		const options = {
			uri: `${serviceUrls.notification}/devices/${id}?token=${userId}`,
			method: 'DELETE',
			json: true,
			timeout: Configuration.get('REQUEST_TIMEOUT'),
		};

		return request(options).then((message) => message);
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
			timeout: Configuration.get('REQUEST_TIMEOUT'),
		};

		return request(options).then((response) => response);
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
			timeout: Configuration.get('REQUEST_TIMEOUT'),
		};

		return request(options).then((message) => message);
	}

	find(params) {
		const serviceUrls = this.app.get('services') || {};

		const userId = (params.account || {}).userId || params.payload.userId;

		const options = {
			uri: `${serviceUrls.notification}/notifications/?user=${userId}&${queryString.stringify(params.query)}`,
			headers: {
				token: userId,
			},
			json: true,
			timeout: Configuration.get('REQUEST_TIMEOUT'),
		};

		return request(options).then((message) => message);
	}

	setup(app) {
		this.app = app;
	}
}

// eslint-disable-next-line func-names
module.exports = function () {
	const app = this;

	app.use('/notification/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));
	app.use('/notification/messages', new MessageService());
	app.use('/notification/devices', new DeviceService());
	app.use('/notification/callback', new CallbackService());
	app.use('/notification', new NotificationService());

	const messageService = app.service('/notification/messages');
	const deviceService = app.service('/notification/devices');
	const callbackService = app.service('/notification/callback');
	const notificationService = app.service('/notification');

	messageService.hooks(hooks);
	deviceService.hooks(hooks);
	callbackService.hooks(hooks);
	notificationService.hooks(hooks);
};
