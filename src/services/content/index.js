'use strict';

const request = require('request-promise-native');
const hooks = require('./hooks');
const material = require('./material-model');
const ratingModel = require('./rating-model');
const mongooseService = require('feathers-mongoose');

const REQUEST_TIMEOUT = 8000; // in ms

class ResourcesService {
	constructor(options) {
		this.options = options || {};
	}

	find(params) {
		const serviceUrls = this.app.get('services') || {};
		const options = {
			uri: serviceUrls.content + '/resources/',
			qs: params.query,
			json: true,
			timeout: REQUEST_TIMEOUT
		};
		return request(options).then(message => {
			return message;
		});
	}

	get(id) {
		const serviceUrls = this.app.get('services') || {};
		const options = {
			uri: serviceUrls.content + '/resources/' + id,
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

class SearchService {
	constructor(options) {
		this.options = options || {};
	}

	find(params) {
		const serviceUrls = this.app.get('services') || {};
		const options = {
			uri: serviceUrls.content + '/search/',
			qs: params.query,
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

class RedirectService {
	constructor(options) {
		this.options = options || {};
	}

	get(id, params) {
		const serviceUrls = this.app.get('services') || {};

		request({
			method: 'POST',
			uri: 'http://localhost:3030/content/rating/', //TODO change this...
			body: {
				materialId: id,
				userId: params.query.userId,
				topicId: params.query.topicId,
				courseId: params.query.courseId
			},
			json: true,
			timeout: REQUEST_TIMEOUT
		});

		return request({
			uri: `${serviceUrls.content}/resources/${id}`,
			json: true,
			timeout: REQUEST_TIMEOUT
		}).then(resource => {
			// Increase Click Counter
			request.patch(serviceUrls.content + '/resources/' + id, {
				json: {
					$inc: {
						clickCount: 1
					}
				}
			});
			return resource.url;
		});
	}

	static redirect(req, res, next) {
		res.redirect(res.data);
	}

	setup(app, path) {
		this.app = app;
	}
}

module.exports = function () {
	const app = this;

	const ratingServiceOptions = {
		Model: ratingModel,
		paginate: {
			default: 10,
			max: 25
		}
	};

	// Initialize material model
	const options = {
		Model: material,
		paginate: {
			default: 10,
			max: 25
		},
		lean: true
	};

	// Initialize our service with options it requires
	app.use('/content/resources', new ResourcesService());
	app.use('/content/search', new SearchService());
	app.use('/content/redirect', new RedirectService(), RedirectService.redirect);
	app.use('/content/rating', mongooseService(ratingServiceOptions));
	app.use('/materials', mongooseService(options));

	// Get our initialize service to that we can bind hooks
	const resourcesService = app.service('/content/resources');
	const searchService = app.service('/content/search');
	const ratingService = app.service('/content/rating');

	// Set up our before hooks
	resourcesService.before(hooks.before);
	searchService.before(hooks.before);
	// ratingService.before(hooks.before); // TODO comment out to test with postman

	// Set up our after hooks
	resourcesService.after(hooks.after);
	searchService.after(hooks.after);
	ratingService.after(hooks.after);
};
