'use strict';

const request = require('request-promise-native');
const hooks = require('./hooks');

const REQUEST_TIMEOUT = 4000; // in ms

class Service {
	constructor(options) {
		this.options = options || {};
	}

	find(params) {
		const userId = params.payload.userId;
		const options = {
			uri: 'https://schul-cloud.org:3000/events/',
			headers: {
				'Authorization': userId
			},
			json: true,
			timeout: REQUEST_TIMEOUT
		};

		return new Promise((resolve, reject) => {
			request(options).then(json => {
				return resolve(json);
			}).catch(err => {
				return reject(err);
			});
		});
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
