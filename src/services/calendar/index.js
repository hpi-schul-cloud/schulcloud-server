'use strict';

const request = require('request-promise-native');
const hooks = require('./hooks');

const REQUEST_TIMEOUT = 4000; // in ms

class Service {
	constructor(options) {
		this.options = options || {};
	}

	find(params) {

		const serviceUrls = this.app.get('services') || {};

		const userId = (params.account ||{}).userId || params.payload.userId;
		const options = {
			uri: serviceUrls.calendar + '/events/',
			headers: {
				'Authorization': userId
			},
			json: true,
			timeout: REQUEST_TIMEOUT
		};

		return request(options).then(events => {
			events = events.map(event => {
				return Object.assign(event, {
					title: event.summary,
					allDay: false, // TODO: find correct value
					start: Date.parse(event.dtstart),
					end: Date.parse(event.dtend),
					url: '' // TODO: add x-sc-field
				});
			});
			return events;
		});
	}

	setup(app, path) {
		this.app = app;
	}
}

module.exports = function () {
	const app = this;

	// Initialize our service with any options it requires
	app.use('/calendar', new Service());

	// Get our initialize service to that we can bind hooks
	const contentService = app.service('/calendar');

	// Set up our before hooks
	contentService.before(hooks.before);

	// Set up our after hooks
	contentService.after(hooks.after);
};

module.exports.Service = Service;
