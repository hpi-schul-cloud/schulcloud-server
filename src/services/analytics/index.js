

const ua = require('universal-analytics');
const logger = require('winston');
const hooks = require('./hooks');

const AnalyticsModel = require('./model');

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
		if (!process.env.ANALYTICS_LOGGING) {
			return 'success';
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
		return model.save()
			.then(_ => 'success')
			.catch((err) => {
				logger.error(err);
				return 'err';
			});
	}

	setup(app, path) {
		this.app = app;
	}
}

module.exports = function () {
	const app = this;

	// Initialize our service with any options it requires
	app.use('/analytics', new Service());

	// Get our initialize service to that we can bind hooks
	const service = app.service('/analytics');

	// Set up our before hooks
	service.before(hooks.before);

	// Set up our after hooks
	service.after(hooks.after);
};

module.exports.Service = Service;
