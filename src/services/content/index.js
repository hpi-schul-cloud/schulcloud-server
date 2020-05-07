const request = require('request-promise-native');
const service = require('feathers-mongoose');
const hooks = require('./hooks');
const material = require('./material-model');

const { REQUEST_TIMEOUT } = require('../../../config/globals');

class ResourcesService {
	constructor(options) {
		this.options = options || {};
	}

	find(params) {
		const serviceUrls = this.app.get('services') || {};
		const options = {
			uri: `${serviceUrls.content}/resources/`,
			qs: params.query,
			json: true,
			timeout: REQUEST_TIMEOUT,
		};
		return request(options).then((message) => message);
	}

	get(id) {
		const serviceUrls = this.app.get('services') || {};
		const options = {
			uri: `${serviceUrls.content}/resources/${id}`,
			json: true,
			timeout: REQUEST_TIMEOUT,
		};
		return request(options).then((message) => message);
	}

	setup(app) {
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
			uri: `${serviceUrls.content}/search/`,
			qs: params.query,
			json: true,
			timeout: REQUEST_TIMEOUT,
		};
		return request(options).then((message) => message);
	}

	setup(app) {
		this.app = app;
	}
}

class RedirectService {
	constructor(options) {
		this.options = options || {};
	}

	get(id) {
		const serviceUrls = this.app.get('services') || {};
		const options = {
			uri: `${serviceUrls.content}/resources/${id}`,
			json: true,
			timeout: REQUEST_TIMEOUT,
		};
		return request(options).then((resource) => {
			// Increase Click Counter
			request.patch(`${serviceUrls.content}/resources/${id}`, {
				json: {
					$inc: {
						clickCount: 1,
					},
				},
			});
			return resource.url;
		});
	}

	static redirect(req, res, next) {
		res.redirect(res.data);
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = function () {
	const app = this;

	const options = {
		Model: material,
		paginate: {
			default: 10,
			max: 25,
		},
		lean: true,
	};

	app.use('/content/resources', new ResourcesService());
	app.use('/content/search', new SearchService());
	app.use('/content/redirect', new RedirectService(), RedirectService.redirect);
	app.use('/materials', service(options));

	const resourcesService = app.service('/content/resources');
	const searchService = app.service('/content/search');

	resourcesService.hooks(hooks);
	searchService.hooks(hooks);
};
