const ua = require('universal-analytics');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const hooks = require('./hooks');
const logger = require('../../logger');

const AnalyticsModel = require('./model');

const { ANALYTICS_LOGGING } = require('../../../config/globals');

class Service {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	create(data, params) {
		if (data.tid) {
			const visitor = ua(data.tid);
			visitor.pageview(data).send();
		}
		if (!ANALYTICS_LOGGING) {
			return Promise.resolve();
		}
		const model = new AnalyticsModel({
			firstPaint: data.cm1,
			timeToInteractive: data.cm2,
			pageLoaded: data.cm3,
			domInteractiveTime: data.cm4,
			domContentLoaded: data.cm5,
			downlink: data.cm6,
			connection: data.cd1,
			requestStart: data.cm7,
			responseStart: data.cm8,
			responseEnd: data.cm9,
			path: data.dp,
			dl: data.dl,
			qt: data.qt,
			cid: data.cid,
			swOffline: data.cd3,
			swEnabled: data.cd4,
			school: data.cd5,
			networkProtocol: data.cd6,
		});
		return model
			.save()
			.then((_) => Promise.resolve())
			.catch((err) => {
				logger.error(err);
				return Promise.reject(new Error());
			});
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = function () {
	const app = this;

	app.use('/analytics/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	app.use('/analytics', new Service());
	const contentService = app.service('/analytics');
	contentService.hooks(hooks);
};

module.exports.Service = Service;
