/* eslint-disable max-classes-per-file */
const service = require('feathers-mongoose');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');
const { get, patch } = require('../../utils/request');
const material = require('./material-model');

const resourcesHooks = require('./hooks/resources');
const redirectHooks = require('./hooks/redirect');
const searchHooks = require('./hooks/search');
const materialsHooks = require('./hooks/materials');
const logger = require('../../logger');

class ResourcesService {
	constructor(options) {
		this.options = options || {};
	}

	find(params) {
		const serviceUrls = this.app.get('services') || {};
		const url = `${serviceUrls.content}/resources/`;
		const options = {
			data: params.query,
		};
		return get(url, options).then((message) => message);
	}

	get(id) {
		const serviceUrls = this.app.get('services') || {};
		const url = `${serviceUrls.content}/resources/${id}`;
		return get(url).then((message) => message);
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
		const url = `${serviceUrls.content}/search/`;
		const options = {
			data: params.query,
		};
		return get(url, options).then((message) => message);
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
		const url = `${serviceUrls.content}/resources/${id}`;
		// Async Increase Click Counter
		patch(`${serviceUrls.content}/resources/${id}`, {
			$inc: {
				clickCount: 1,
			},
		}).catch((err) => logger.error('failed to increase click counter', err));
		return get(url).then((resource) => {
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

	app.use('/content/api', staticContent(path.join(__dirname, '/docs')));

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
	const redirectService = app.service('/content/redirect');
	const materialsService = app.service('/materials');

	resourcesService.hooks(resourcesHooks);
	searchService.hooks(searchHooks);
	redirectService.hooks(redirectHooks);
	materialsService.hooks(materialsHooks);
};
